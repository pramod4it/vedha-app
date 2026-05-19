import { ProgrammingLanguage } from '@shared/api.ts';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';

const LANGUAGE_LABELS: Partial<Record<ProgrammingLanguage, string>> = {
  [ProgrammingLanguage.Java]: 'Java',
  [ProgrammingLanguage.C]: 'C',
  [ProgrammingLanguage.Cpp]: 'C++',
};

interface LanguageSelectorProps {
  compact?: boolean;
  showReadableVarNames?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  compact = false,
  showReadableVarNames = true,
}) => {
  const { solutionLanguage, updateSolutionLanguage, loading, error } = useSettings();
  const [readableVarNames, setReadableVarNames] = useState(false);

  useEffect(() => {
    if (window.electronAPI?.getReadableVarNames) {
      window.electronAPI
        .getReadableVarNames()
        .then((result) => {
          if (result.success && result.readableVarNames !== undefined) {
            setReadableVarNames(result.readableVarNames);
          }
        })
        .catch(console.error);
    }
  }, []);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value as ProgrammingLanguage;
    updateSolutionLanguage(newLanguage).catch((error) => {
      console.error('Error updating language:', error);
    });
  };

  const handleReadableVarNamesChange = (value: boolean) => {
    setReadableVarNames(value);
    if (window.electronAPI?.setReadableVarNames) {
      window.electronAPI.setReadableVarNames(value).catch(console.error);
    }
  };

  if (error) {
    return (
      <div className={compact ? 'flex items-center gap-2' : 'mb-3 px-2 space-y-1'}>
        <div className="text-[11px] text-red-400">Error loading language settings</div>
      </div>
    );
  }

  return (
    <div className={compact ? 'flex items-center gap-2' : 'mb-3 px-2 space-y-1'}>
      <div className={compact ? 'flex items-center gap-2 text-[11px] font-medium text-zinc-400' : 'flex items-center justify-between text-[13px] font-medium text-white/90'}>
        <span className={compact ? 'uppercase tracking-wide' : undefined}>
          Code in{loading ? ' (loading...)' : ''}
        </span>
        <select
          value={solutionLanguage}
          onChange={handleLanguageChange}
          disabled={loading}
          className={
            compact
              ? 'h-8 rounded-lg border border-zinc-800 bg-zinc-950/70 px-2 text-[11px] font-medium text-zinc-100 outline-hidden transition focus:border-cyan-500/70 disabled:opacity-50'
              : 'bg-white/10 rounded-sm px-2 py-1 text-sm outline-hidden border border-white/10 focus:border-white/20 disabled:opacity-50'
          }
        >
          {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
            <option key={value} value={value} className="text-black">
              {label}
            </option>
          ))}
        </select>
      </div>
      {showReadableVarNames ? (
        <>
          <label className="flex items-center justify-between text-[13px] font-medium text-white/90 cursor-pointer">
            <span>Readable var names</span>
            <input
              type="checkbox"
              checked={readableVarNames}
              onChange={(e) => handleReadableVarNamesChange(e.target.checked)}
              className="accent-blue-500"
            />
          </label>
          <p className="text-[10px] leading-relaxed text-gray-400">
            e.g. leftIndex instead of l, currentSum instead of s. Simple loop iterators like i stay
            short.
          </p>
        </>
      ) : null}
    </div>
  );
};
