import React, { useState, useEffect, useRef } from 'react';
import {
  CategoryKey,
  TransactionType,
  Transaction,
  AiTransactionDraft,
  AiParseResponse,
} from '../types';
import { CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories';
import { STRINGS } from '../constants/strings';
import { getWibTodayString, parseRupiahInput } from '../lib/formatters';
import { compressReceiptImage } from '../lib/imageCompressor';
import { isSpeechRecognitionSupported, createSpeechRecognizer } from '../lib/speech';
import { ConfirmationCard } from './ConfirmationCard';
import { CategoryIcon } from './CategoryIcon';
import {
  X,
  Sparkles,
  Camera,
  Edit3,
  Mic,
  MicOff,
  Upload,
  Loader2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTransactions: (
    txs: Omit<Transaction, 'id' | 'createdAt'>[],
    rulesToSave?: { merchant: string; category: CategoryKey }[]
  ) => Promise<void>;
  existingRules?: { pattern: string; category: CategoryKey }[];
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onSaveTransactions,
  existingRules = [],
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'photo' | 'manual'>('chat');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // AI draft state for confirmation card
  const [aiDrafts, setAiDrafts] = useState<AiTransactionDraft[] | null>(null);
  const originalAiDraftsRef = useRef<AiTransactionDraft[]>([]);

  // Chat AI Tab State
  const [chatText, setChatText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const speechRecognizerRef = useRef<any>(null);
  const speechSupported = isSpeechRecognitionSupported();

  // Photo Tab State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Manual Tab State
  const [manualType, setManualType] = useState<TransactionType>('expense');
  const [manualAmount, setManualAmount] = useState<number>(0);
  const [manualCategory, setManualCategory] = useState<CategoryKey>('makan_minum');
  const [manualDate, setManualDate] = useState<string>(getWibTodayString());
  const [manualMerchant, setManualMerchant] = useState<string>('');
  const [manualNote, setManualNote] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setAiDrafts(null);
      setChatText('');
      setPhotoPreview(null);
      setManualDate(getWibTodayString());
      setManualAmount(0);
      setManualMerchant('');
      setManualNote('');
      setManualCategory(manualType === 'expense' ? 'makan_minum' : 'uang_saku');
    }
  }, [isOpen]);

  // Handle Speech Recognition toggle
  const toggleListening = () => {
    if (isListening) {
      if (speechRecognizerRef.current) {
        speechRecognizerRef.current.stop();
      }
      setIsListening(false);
    } else {
      const recognizer = createSpeechRecognizer(
        (transcript) => {
          setChatText((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setIsListening(false);
        },
        () => setIsListening(false),
        (err) => {
          console.warn('Speech error:', err);
          setIsListening(false);
        }
      );

      if (recognizer) {
        speechRecognizerRef.current = recognizer;
        try {
          recognizer.start();
          setIsListening(true);
        } catch {
          setIsListening(false);
        }
      }
    }
  };

  // Process AI request via backend /api/ai/parse
  const processAiParse = async (mode: 'chat' | 'photo', payload: any) => {
    setLoading(true);
    setErrorMessage(null);
    const todayStr = getWibTodayString();

    try {
      const body = {
        mode: mode === 'chat' ? 'text' : 'photo',
        today: todayStr,
        ...payload,
      };

      const res = await fetch('/api/ai/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(`Server status ${res.status}`);
      }

      const data: AiParseResponse = await res.json();

      // Check if photo is not a receipt (PRD Section 4 & F4)
      if (mode === 'photo' && !data.isReceipt) {
        setErrorMessage(
          data.message || STRINGS.errorStates.aiFailed
        );
        setLoading(false);
        return;
      }

      if (!data.transactions || data.transactions.length === 0) {
        setErrorMessage(STRINGS.errorStates.aiFailed);
        setLoading(false);
        return;
      }

      // Check lowest confidence (PRD Section 6 confidence gate):
      // < 0.5: minta foto ulang atau ketik manual
      const getMinConf = (t: AiTransactionDraft) =>
        Math.min(t.confidence.amount, t.confidence.date, t.confidence.merchant, t.confidence.category);
      const minConfidence = Math.min(...data.transactions.map(getMinConf));

      if (minConfidence < 0.5) {
        setErrorMessage(
          'Tingkat keyakinan AI terlalu rendah (< 50%). Coba foto nota lebih terang atau masukkan manual ya.'
        );
        setLoading(false);
        return;
      }

      // Apply existing category rules before confirmation (PRD F7)
      const adjustedDrafts = data.transactions.map((tx) => {
        if (tx.merchant) {
          const lowerM = tx.merchant.toLowerCase();
          const matchedRule = existingRules.find((r) => lowerM.includes(r.pattern));
          if (matchedRule) {
            return { ...tx, category: matchedRule.category };
          }
        }
        return tx;
      });

      originalAiDraftsRef.current = JSON.parse(JSON.stringify(adjustedDrafts));
      setAiDrafts(adjustedDrafts);
    } catch (err) {
      console.error('Parse error:', err);
      setErrorMessage(STRINGS.errorStates.networkError);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;
    processAiParse('chat', { text: chatText });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      // Compress in browser before sending (PRD F4: max 1568px, JPEG 0.8)
      const compressed = await compressReceiptImage(file);
      setPhotoPreview(`data:${compressed.mimeType};base64,${compressed.base64Data}`);

      await processAiParse('photo', {
        imageBase64: compressed.base64Data,
        mimeType: compressed.mimeType,
      });
    } catch (err: any) {
      console.error('Photo compress error:', err);
      setErrorMessage(err.message || 'Gagal memproses gambar nota.');
      setLoading(false);
    }
  };

  // Confirm and save drafts
  const handleConfirmDrafts = async (
    finalDrafts: AiTransactionDraft[],
    _feedback?: 'up' | 'down'
  ) => {
    // Check if user corrected the category for any merchant (PRD F7 auto-rules)
    const rulesToSave: { merchant: string; category: CategoryKey }[] = [];
    finalDrafts.forEach((fd, i) => {
      const orig = originalAiDraftsRef.current[i];
      if (orig && fd.merchant && fd.category !== orig.category) {
        rulesToSave.push({ merchant: fd.merchant, category: fd.category });
      }
    });

    const txRecords: Omit<Transaction, 'id' | 'createdAt'>[] = finalDrafts.map((d) => ({
      type: d.type,
      amount: d.amount,
      category: d.category,
      merchant: d.merchant,
      note: d.note,
      occurredAt: `${d.date}T12:00:00+07:00`,
      source: activeTab === 'chat' ? 'chat' : 'photo',
      confidence: d.confidence,
      items: d.items || [],
      deletedAt: null,
    }));

    await onSaveTransactions(txRecords, rulesToSave);
    onClose();
  };

  // Submit manual transaction
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualAmount <= 0) {
      setErrorMessage('Nominal harus lebih dari 0.');
      return;
    }

    const txRecord: Omit<Transaction, 'id' | 'createdAt'> = {
      type: manualType,
      amount: manualAmount,
      category: manualCategory,
      merchant: manualMerchant.trim() || null,
      note: manualNote.trim() || null,
      occurredAt: `${manualDate}T12:00:00+07:00`,
      source: 'manual',
      confidence: null,
      items: [
        {
          name: manualMerchant.trim() || (manualType === 'expense' ? 'Pengeluaran' : 'Pemasukan'),
          qty: 1,
          unitPrice: manualAmount,
          total: manualAmount,
        },
      ],
      deletedAt: null,
    };

    await onSaveTransactions([txRecord]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden animate-in slide-in-from-bottom duration-200">
        
        {/* Header modal */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{STRINGS.addModal.title}</h2>
              <p className="text-xs text-slate-500">Pilih metode pencatatan yang paling nyaman buat kamu</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 touch-target flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 overflow-y-auto flex-1">
          {aiDrafts ? (
            <ConfirmationCard
              drafts={aiDrafts}
              onConfirm={handleConfirmDrafts}
              onCancel={() => setAiDrafts(null)}
            />
          ) : (
            <>
              {/* Tab selector */}
              <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-2xl mb-5">
                <button
                  type="button"
                  onClick={() => { setActiveTab('chat'); setErrorMessage(null); }}
                  className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition ${
                    activeTab === 'chat'
                      ? 'bg-white text-moneta-primary shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles size={16} />
                  {STRINGS.addModal.tabChat}
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('photo'); setErrorMessage(null); }}
                  className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition ${
                    activeTab === 'photo'
                      ? 'bg-white text-moneta-primary shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Camera size={16} />
                  {STRINGS.addModal.tabPhoto}
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('manual'); setErrorMessage(null); }}
                  className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition ${
                    activeTab === 'manual'
                      ? 'bg-white text-moneta-primary shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Edit3 size={16} />
                  {STRINGS.addModal.tabManual}
                </button>
              </div>

              {/* Error Alert Box */}
              {errorMessage && (
                <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p>{errorMessage}</p>
                    <button
                      type="button"
                      onClick={() => setErrorMessage(null)}
                      className="mt-1 font-semibold underline text-red-900"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <Loader2 className="animate-spin text-teal-600" size={36} />
                  <p className="text-sm font-semibold text-slate-800">
                    {activeTab === 'photo' ? STRINGS.addModal.photoProcessing : 'Sedang memproses catatan kamu...'}
                  </p>
                  <p className="text-xs text-slate-500 max-w-xs">
                    AI sedang mengekstrak nominal, merchant, tanggal, dan kategori secara otomatis.
                  </p>
                </div>
              )}

              {!loading && activeTab === 'chat' && (
                <form onSubmit={handleChatSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Ketik apa saja pengeluaranmu hari ini
                    </label>
                    <div className="relative">
                      <textarea
                        rows={3}
                        value={chatText}
                        onChange={(e) => setChatText(e.target.value)}
                        placeholder={STRINGS.addModal.chatPlaceholder}
                        className="w-full p-3.5 text-sm text-slate-900 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 resize-none pr-12"
                      />
                      {speechSupported && (
                        <button
                          type="button"
                          onClick={toggleListening}
                          className={`absolute right-3 bottom-3 p-2 rounded-xl transition ${
                            isListening
                              ? 'bg-red-500 text-white animate-pulse'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                          title="Input Suara (Bahasa Indonesia)"
                        >
                          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                        </button>
                      )}
                    </div>
                    {isListening && (
                      <p className="text-xs text-teal-700 font-medium mt-1 animate-pulse">
                        {STRINGS.addModal.chatMicListening}
                      </p>
                    )}
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
                    <div className="flex items-center gap-1 font-semibold text-slate-700">
                      <HelpCircle size={14} className="text-teal-600" /> Contoh kalimat pintar:
                    </div>
                    <p className="italic">• "makan ayam bakar 20rb"</p>
                    <p className="italic">• "kopi susu 18k tadi pagi"</p>
                    <p className="italic">• "bakso 15rb dan es teh 5rb" (bisa beberapa transaksi sekaligus)</p>
                    <p className="italic">• "isi bensin 25.000 kemarin"</p>
                    <p className="italic">• "dapat uang saku 1,5jt"</p>
                  </div>

                  <button
                    type="submit"
                    disabled={!chatText.trim()}
                    className="w-full py-3 px-4 bg-moneta-primary hover:bg-teal-800 disabled:opacity-50 text-white font-semibold rounded-btn text-sm shadow-md transition flex items-center justify-center gap-2 touch-target"
                  >
                    <Sparkles size={18} />
                    {STRINGS.addModal.chatSendButton}
                  </button>
                </form>
              )}

              {!loading && activeTab === 'photo' && (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-teal-500 p-8 rounded-2xl text-center cursor-pointer transition bg-slate-50/50 hover:bg-teal-50/20 flex flex-col items-center justify-center space-y-3"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="p-3 bg-teal-100/70 text-teal-800 rounded-2xl">
                      <Upload size={28} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {STRINGS.addModal.photoUploadTitle}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                        {STRINGS.addModal.photoUploadDesc}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="px-4 py-2 bg-white border border-slate-300 text-xs font-semibold rounded-xl text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      {STRINGS.addModal.photoSelectButton}
                    </button>
                  </div>

                  {photoPreview && (
                    <div className="p-2 border rounded-xl bg-slate-50 flex items-center gap-3">
                      <img
                        src={photoPreview}
                        alt="Preview nota"
                        className="w-14 h-14 object-cover rounded-lg border"
                      />
                      <div className="text-xs text-slate-600 flex-1">
                        <p className="font-semibold text-slate-800">Foto Siap Diproses</p>
                        <p>Dikompresi otomatis di browser sebelum dianalisis.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!loading && activeTab === 'manual' && (
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  {/* Type Selector */}
                  <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setManualType('expense');
                        setManualCategory('makan_minum');
                      }}
                      className={`py-2 text-xs font-semibold rounded-lg transition ${
                        manualType === 'expense'
                          ? 'bg-slate-900 text-white shadow'
                          : 'text-slate-600'
                      }`}
                    >
                      {STRINGS.addModal.manualTypeExpense}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setManualType('income');
                        setManualCategory('uang_saku');
                      }}
                      className={`py-2 text-xs font-semibold rounded-lg transition ${
                        manualType === 'income'
                          ? 'bg-emerald-700 text-white shadow'
                          : 'text-slate-600'
                      }`}
                    >
                      {STRINGS.addModal.manualTypeIncome}
                    </button>
                  </div>

                  {/* Big Amount Input */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      {STRINGS.addModal.manualAmountLabel}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-lg font-bold text-slate-500">Rp</span>
                      <input
                        type="text"
                        value={manualAmount ? new Intl.NumberFormat('id-ID').format(manualAmount) : ''}
                        onChange={(e) => setManualAmount(parseRupiahInput(e.target.value))}
                        placeholder={STRINGS.addModal.manualAmountPlaceholder}
                        className="w-full pl-12 pr-4 py-3 text-2xl font-bold text-slate-900 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
                        required
                      />
                    </div>
                  </div>

                  {/* Category Chips */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      {STRINGS.addModal.manualCategoryLabel}
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 border rounded-xl border-slate-100 bg-slate-50/50">
                      {(manualType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(
                        (cat) => {
                          const isSelected = manualCategory === cat.key;
                          return (
                            <button
                              key={cat.key}
                              type="button"
                              onClick={() => setManualCategory(cat.key)}
                              className={`px-3 py-1.5 text-xs font-medium rounded-xl flex items-center gap-1.5 transition ${
                                isSelected
                                  ? 'bg-teal-700 text-white shadow-sm'
                                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <CategoryIcon category={cat.key} size={14} className="p-0.5 rounded" />
                              {cat.label}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* Date & Merchant */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        {STRINGS.addModal.manualDateLabel}
                      </label>
                      <input
                        type="date"
                        value={manualDate}
                        onChange={(e) => setManualDate(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        {STRINGS.addModal.manualMerchantLabel}
                      </label>
                      <input
                        type="text"
                        value={manualMerchant}
                        onChange={(e) => setManualMerchant(e.target.value)}
                        placeholder={STRINGS.addModal.manualMerchantPlaceholder}
                        className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
                      />
                    </div>
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      {STRINGS.addModal.manualNoteLabel}
                    </label>
                    <input
                      type="text"
                      value={manualNote}
                      onChange={(e) => setManualNote(e.target.value)}
                      placeholder={STRINGS.addModal.manualNotePlaceholder}
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-moneta-primary hover:bg-teal-800 text-white font-semibold rounded-btn text-sm shadow-md transition flex items-center justify-center gap-2 touch-target"
                  >
                    {STRINGS.addModal.submitManual}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
