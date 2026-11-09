
import React, { useRef } from 'react';
import { useUser } from '../contexts/UserContext';

interface ScreenProps {
  setPage: (page: number) => void;
  onNext?: () => void;
  isWizard?: boolean;
}

const ChiSei: React.FC<ScreenProps> = ({ setPage, onNext, isWizard }) => {
  const { userData, setUserData } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userData.nome && userData.eta && userData.genere) {
      setUserData(prev => ({
        ...prev,
        completedTests: { ...prev.completedTests, chiSei: true }
      }));
      if (onNext) {
        onNext();
      } else {
        setPage(0); // Callback to return to dashboard
      }
    } else {
      alert("Per favore, compila tutti i campi.");
    }
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const parsedData = JSON.parse(json);
        // Validazione minima
        if (parsedData && typeof parsedData === 'object' && 'nome' in parsedData) {
            setUserData(parsedData);
            alert("Dati ripristinati con successo!");
            setPage(0);
        } else {
            alert("Il file non sembra essere un backup valido.");
        }
      } catch (error) {
        alert("Errore nella lettura del file.");
        console.error(error);
      }
    };
    reader.readAsText(file);
  };

  const isProMode = true;

  return (
    <div className={`${isProMode ? 'bg-[#0a0a0c] text-white' : 'bg-white'} min-h-screen p-4 sm:p-6 transition-colors duration-500`}>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className={`text-3xl font-serif font-black ${isProMode ? 'text-cyan-400' : 'text-gray-800'}`}>CHI SEI?</h2>
          <h3 className={`text-sm tracking-widest uppercase font-bold mt-1 ${isProMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Identità Analogica
          </h3>
        </div>
        {!isWizard && (
          <button onClick={() => setPage(0)} className="text-xs uppercase tracking-widest font-bold text-cyan-500 hover:text-cyan-400">
            &larr; HOME
          </button>
        )}
      </div>
      
      <div className={`border-l-4 p-5 mb-8 text-sm ${isProMode ? 'bg-cyan-950/20 border-cyan-500 text-cyan-100' : 'bg-blue-50 border-blue-500 text-blue-800'}`}>
          <p className="leading-relaxed">I tuoi dati sono necessari per la voce guida. Saranno processati <strong>solo localmente</strong> e cancellati alla chiusura.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="group">
          <label htmlFor="nome" style={{ color: '#fbfbfb' }} className="block text-[10px] font-black tracking-[0.2em] uppercase mb-2">NOME</label>
          <input
            type="text"
            id="nome"
            name="nome"
            value={userData.nome}
            onChange={handleChange}
            placeholder="IL TUO NOME..."
            style={{ color: '#090909', backgroundColor: '#ffffff' }}
            className="block w-full px-4 py-4 rounded-xl transition-all duration-300 border-2 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="group">
            <label htmlFor="eta" style={{ color: '#ffffff' }} className="block text-[10px] font-black tracking-[0.2em] uppercase mb-2">ETÀ</label>
            <input
              type="number"
              id="eta"
              name="eta"
              value={userData.eta}
              onChange={handleChange}
              style={{ color: '#070606', backgroundColor: '#ffffff' }}
              className="block w-full px-4 py-4 rounded-xl transition-all duration-300 border-2 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
              required
            />
          </div>
          <div className="group">
            <label htmlFor="genere" style={{ color: '#ffffff' }} className="block text-[10px] font-black tracking-[0.2em] uppercase mb-2">GENERE</label>
            <select
              id="genere"
              name="genere"
              value={userData.genere}
              onChange={handleChange}
              style={{ color: '#070606', backgroundColor: '#ffffff' }}
              className="block w-full px-4 py-4 rounded-xl transition-all duration-300 border-2 outline-none appearance-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
              required
            >
              <option value="" disabled>SELEZIONA...</option>
              <option value="MASCHIO">MASCHIO</option>
              <option value="FEMMINA">FEMMINA</option>
            </select>
          </div>
        </div>

        <div className="group">
          <label htmlFor="problema" style={{ color: '#ffffff' }} className="block text-[10px] font-black tracking-[0.2em] uppercase mb-2">PROBLEMA CHE VUOI RISOLVERE</label>
          <textarea
            id="problema"
            name="problema"
            value={userData.problema}
            onChange={handleChange}
            rows={4}
            placeholder="Qual è il tuo disagio attuale?"
            style={{ color: '#000000', backgroundColor: '#ffffff' }}
            className="block w-full px-4 py-4 rounded-xl transition-all duration-300 border-2 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
          />
        </div>

        <div className="p-5 rounded-2xl border bg-cyan-900/10 border-cyan-900/30">
          <p style={{ color: '#d8d8d8' }} className="text-sm text-center font-medium">
             Focalizzati su cosa ti impedisce di sentirti libero/a.
          </p>
        </div>
        
        <div className="mt-10 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="relative">
             <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".json" 
                className="hidden" 
             />
             <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`text-[10px] font-black tracking-[0.2em] uppercase ${isProMode ? 'text-gray-500 hover:text-cyan-400' : 'text-gray-400 hover:text-blue-600'}`}
             >
                📂 CARICA BACKUP
             </button>
          </div>

          <button
            type="submit"
            className={`w-full sm:w-auto font-black py-4 px-10 rounded-2xl transition-all duration-300 shadow-xl uppercase tracking-widest transform active:scale-95 ${
              isProMode 
                ? 'bg-cyan-600 text-white hover:bg-cyan-500 hover:shadow-cyan-500/20' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            PROCEDI →
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChiSei;
