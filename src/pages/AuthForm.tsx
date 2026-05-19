import type { AuthenticatedUser } from '@shared/api.ts';
import { IPC_EVENTS } from '@shared/constants.ts';
import React, { useState } from 'react';
import CommandButton from '../components/shared/commands/CommandButton.tsx';
import { getAuthProvider } from '../services/auth/index';
import { resumeService } from '../services/resume.ts';
import { sendToElectron } from '../utils/electron.ts';

interface AuthFormProps {
  setUser: (user: AuthenticatedUser | null) => void;
}

interface FormState {
  email: string;
  password: string;
  companyName: string;
  interviewerName: string;
  answerDepth: 'short' | 'medium' | 'systemdesign';
  resumeSummary: string;
  error: string;
  passwordError: string;
  isLoading: boolean;
  isResumeUploading: boolean;
  resumeFileName: string;
  isSignUp: boolean;
  shake: boolean;
}

const initialState: FormState = {
  email: '',
  password: '',
  companyName: '',
  interviewerName: '',
  answerDepth: 'short',
  resumeSummary: '',
  error: '',
  passwordError: '',
  isLoading: false,
  isResumeUploading: false,
  resumeFileName: '',
  isSignUp: false,
  shake: false,
};

export function AuthForm({ setUser }: AuthFormProps) {
  const [formState, setFormState] = useState<FormState>(initialState);
  const authProvider = getAuthProvider();

  React.useEffect(() => {
    window.electronAPI
      .updateContentDimensions({
        width: 560,
        height: 860,
        source: 'AuthForm',
      })
      .catch(console.error);
  }, []);

  React.useEffect(() => {
    const loadLastUsedDetails = async () => {
      try {
        const [emailResult, metadataResult] = await Promise.all([
          window.electronAPI.authGetLastUsedEmail(),
          window.electronAPI.getInterviewMetadata(),
        ]);

        if (emailResult.success && emailResult.email) {
          setFormState((prev) => ({ ...prev, email: emailResult.email! }));
        }

        if (metadataResult.success && metadataResult.metadata) {
          setFormState((prev) => ({
            ...prev,
            companyName: metadataResult.metadata?.companyName || '',
            interviewerName: metadataResult.metadata?.interviewerName || '',
            answerDepth: metadataResult.metadata?.answerDepth || 'short',
            resumeSummary: metadataResult.metadata?.resumeSummary || '',
          }));
        }
      } catch (error) {
        console.error('Error loading last used details:', error);
      }
    };

    loadLastUsedDetails().catch(console.error);

  }, []);

  
  const validatePassword = (value: string): boolean => {
    if (formState.isSignUp && value.length < 6) {
      setFormState((prev) => ({
        ...prev,
        passwordError: 'Password must be at least 6 characters',
      }));

      return false;
    }
    setFormState((prev) => ({ ...prev, passwordError: '' }));

    return true;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormState((prev) => ({ ...prev, password: value }));
    if (value && formState.isSignUp) {
      validatePassword(value);
    } else {
      setFormState((prev) => ({ ...prev, passwordError: '' }));
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({ ...prev, email: e.target.value }));
  };

  const handleInterviewFieldChange =
    (
      field:
        | 'companyName'
        | 'interviewerName'
        | 'resumeSummary',
    ) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setFormState((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleResumeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file =
      e.target.files?.[0];

    if (!file) {
      return;
    }

    const supportedExtensions =
      ['.pdf', '.doc', '.docx', '.txt', '.md', '.markdown'];
    const lowerName =
      file.name.toLowerCase();
    const isSupported =
      supportedExtensions.some((extension) => lowerName.endsWith(extension));

    if (!isSupported) {
      setFormState((prev) => ({
        ...prev,
        error: 'Please upload a PDF, DOC, DOCX, TXT, or MD resume.',
        resumeFileName: file.name,
      }));
      e.target.value = '';

      return;
    }

    setFormState((prev) => ({
      ...prev,
      isResumeUploading: true,
      resumeFileName: file.name,
      error: '',
    }));

    try {
      const extractedResume =
        await resumeService.extract(file);

      setFormState((prev) => ({
        ...prev,
        resumeSummary: extractedResume.text,
        resumeFileName: extractedResume.fileName || file.name,
        isResumeUploading: false,
        error: '',
      }));
    } catch (error: any) {
      setFormState((prev) => ({
        ...prev,
        isResumeUploading: false,
        error:
          error?.message ||
          error?.response?.data?.message ||
          'Could not extract text from this resume. Please paste the resume text.',
      }));
    } finally {
      e.target.value = '';
    }
  };

  const saveInterviewMetadata = async () => {
    const existingMetadata =
      await window.electronAPI.getInterviewMetadata();

    await window.electronAPI.setInterviewMetadata({
      companyName: formState.companyName.trim(),
      interviewerName: formState.interviewerName.trim(),
      answerDepth: formState.answerDepth,
      chatSessionId:
        existingMetadata.success
          ? existingMetadata.metadata?.chatSessionId
          : undefined,
      chatSessionStartedAt:
        existingMetadata.success
          ? existingMetadata.metadata?.chatSessionStartedAt
          : undefined,
      chatContextClearedAt:
        existingMetadata.success
          ? existingMetadata.metadata?.chatContextClearedAt
          : undefined,
      solutionLanguage:
        existingMetadata.success
          ? existingMetadata.metadata?.solutionLanguage
          : undefined,
      resumeSummary: formState.resumeSummary.trim(),
    });
  };

  const handleSignUp = async (): Promise<void> => {
    const { data: signUpData, error: signUpError } = await authProvider.signUp(
      formState.email,
      formState.password,
    );

    if (signUpError) {
      throw new Error(signUpError.name);
    }

    if (signUpData?.session) {
      const { session } = signUpData;
      await authProvider.setAuthToken(session.access_token);

      const userResponse = await authProvider.getCurrentUser();
      if (userResponse) {
        try {
          await window.electronAPI.authSetLastUsedEmail(formState.email);
        } catch (error) {
          console.error('Error saving last used email:', error);
        }
        setUser(userResponse);
      }

      return;
    }

    setFormState((prev) => ({
      ...prev,
      error: 'Please check your email to confirm your account',
    }));
    setTimeout(() => {
      setFormState((prev) => ({ ...prev, isSignUp: false }));
    }, 2000);
  };

  const handleSignIn = async (): Promise<void> => {
    const response = await authProvider.login(formState.email, formState.password);

    const error = response.error;
    if (error && 'code' in error) {
      setFormState((prev) => ({
        ...prev,
        error: 'Authentication failed',
      }));
      setFormState((prev) => ({ ...prev, shake: true }));
      setTimeout(() => setFormState((prev) => ({ ...prev, shake: false })), 500);

      return;
    }

    if (response.data?.session) {
      const { session } = response.data;
      await authProvider.setAuthToken(session.access_token);

      const userResponse = await authProvider.getCurrentUser();
      if (userResponse) {
        try {
          await window.electronAPI.authSetLastUsedEmail(formState.email);
        } catch (error) {
          console.error('Error saving last used email:', error);
        }
        setUser(userResponse);
      }
    } else {
      setFormState((prev) => ({
        ...prev,
        error: 'Invalid response from server',
      }));
      setFormState((prev) => ({ ...prev, shake: true }));
      setTimeout(() => setFormState((prev) => ({ ...prev, shake: false })), 500);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formState.isSignUp && !validatePassword(formState.password)) {
      setFormState((prev) => ({ ...prev, shake: true }));
      setTimeout(() => setFormState((prev) => ({ ...prev, shake: false })), 500);

      return;
    }

    setFormState((prev) => ({ ...prev, isLoading: true, error: '' }));

    try {
      await saveInterviewMetadata();

      if (formState.isSignUp) {
        await handleSignUp();
      } else {
        await handleSignIn();
      }
    } catch (error: any) {
      console.error(`Error ${formState.isSignUp ? 'signing up' : 'signing in'}:`, error);
      setFormState((prev) => ({
        ...prev,
        error: 'Something went wrong, try again later',
      }));
      setFormState((prev) => ({ ...prev, shake: true }));
      setTimeout(() => setFormState((prev) => ({ ...prev, shake: false })), 500);
    } finally {
      setFormState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const toggleMode = () => {
    setFormState((prev) => ({
      ...prev,
      isSignUp: !prev.isSignUp,
      error: '',
      passwordError: '',
      email: '',
      password: '',
    }));
  };

  const isFormValid =
    formState.email &&
    formState.password &&
    formState.companyName &&
    formState.interviewerName &&
    !formState.isResumeUploading &&
    !formState.passwordError;

  return (
    <div className="min-h-[520px] max-h-[calc(100vh-24px)] w-[520px] max-w-[calc(100vw-24px)] mx-auto overflow-y-auto bg-black/70 rounded-xl border border-white/10 flex flex-col backdrop-blur-md shadow-lg">
      <div className="flex flex-col items-center justify-center flex-1 px-5 pb-1">
        <div className="w-full max-w-[460px] space-y-5 p-3">
          <div className="flex flex-col items-center justify-center space-y-4">
            <h2 className="text-lg font-semibold text-gray-100">
              {formState.isSignUp ? 'Create account' : 'Log in'}
            </h2>

            <div className="w-full space-y-3">
              <form
                onSubmit={(e) => {
                  handleEmailAuth(e).catch(console.error);
                }}
                className="space-y-2.5"
              >
                <div className="space-y-1">
                  <input
                    type="email"
                    placeholder="Email address"
                    value={formState.email}
                    onChange={handleEmailChange}
                    className={`w-full px-3 py-2 text-gray-100 rounded-lg border bg-[#1E2530]/70 focus:outline-hidden text-sm font-medium placeholder:text-gray-400 placeholder:font-normal transition-colors ${
                      formState.error
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-700 focus:border-gray-600'
                    } ${formState.shake ? 'shake' : ''}`}
                    required
                  />
                  {formState.error && (
                    <p className="text-sm text-red-400 px-1">{formState.error}</p>
                  )}
                </div>
                <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-cyan-100">
                        Resume first
                      </p>
                      <p className="text-[10px] leading-4 text-cyan-100/60">
                        Used for intro, project architecture, and experience answers.
                      </p>
                    </div>
                    {formState.resumeFileName && (
                      <span className="max-w-[180px] truncate rounded-full border border-cyan-500/20 px-2 py-0.5 text-[10px] text-cyan-100/80">
                        {formState.resumeFileName}
                      </span>
                    )}
                  </div>
                  <label className="mb-2 block cursor-pointer rounded-md border border-dashed border-cyan-500/30 bg-black/20 px-3 py-2 text-center text-[11px] font-medium text-cyan-100/80 hover:border-cyan-400/50 hover:text-cyan-100">
                    {formState.isResumeUploading
                      ? 'Extracting resume...'
                      : 'Upload PDF / DOC / DOCX'}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.md,.markdown,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
                      onChange={handleResumeFileChange}
                      disabled={formState.isResumeUploading}
                      className="hidden"
                    />
                  </label>
                  <textarea
                    placeholder="Paste resume text here if you have PDF/DOCX. Include latest project, role, tech stack, responsibilities, and achievements."
                    value={formState.resumeSummary}
                    onChange={handleInterviewFieldChange('resumeSummary')}
                    rows={4}
                    className="w-full resize-y px-3 py-2 text-gray-100 rounded-lg border border-gray-700 bg-[#1E2530]/70 focus:border-gray-600 focus:outline-hidden text-sm font-medium placeholder:text-gray-400 placeholder:font-normal transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <input
                    type="password"
                    placeholder="Password"
                    value={formState.password}
                    onChange={handlePasswordChange}
                    className={`w-full px-3 py-2 text-gray-100 rounded-lg border bg-[#1E2530]/70 focus:outline-hidden text-sm font-medium placeholder:text-gray-400 placeholder:font-normal transition-colors ${
                      formState.passwordError
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-700 focus:border-gray-600'
                    } ${formState.shake ? 'shake' : ''}`}
                    required
                  />
                  {formState.passwordError && (
                    <p className="text-sm text-red-400 px-1">{formState.passwordError}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <input
                    type="text"
                    placeholder="Company name"
                    value={formState.companyName}
                    onChange={handleInterviewFieldChange('companyName')}
                    className="w-full px-3 py-2 text-gray-100 rounded-lg border border-gray-700 bg-[#1E2530]/70 focus:border-gray-600 focus:outline-hidden text-sm font-medium placeholder:text-gray-400 placeholder:font-normal transition-colors"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <input
                    type="text"
                    placeholder="Interviewer name"
                    value={formState.interviewerName}
                    onChange={handleInterviewFieldChange('interviewerName')}
                    className="w-full px-3 py-2 text-gray-100 rounded-lg border border-gray-700 bg-[#1E2530]/70 focus:border-gray-600 focus:outline-hidden text-sm font-medium placeholder:text-gray-400 placeholder:font-normal transition-colors"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={formState.isLoading || !isFormValid}
                  className="relative w-full px-3 py-2 rounded-lg bg-linear-to-r from-fuchsia-600 to-cyan-600 hover:from-fuchsia-700 hover:to-cyan-700 text-white border-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {formState.isLoading
                    ? formState.isSignUp
                      ? 'Creating account...'
                      : 'Signing in...'
                    : formState.isSignUp
                      ? 'Create account'
                      : 'Sign in'}
                </button>
              </form>

              <button
                onClick={toggleMode}
                className="block w-full p-2.5 text-center text-sm text-gray-400 hover:text-gray-300 transition-colors"
              >
                {formState.isSignUp
                  ? 'Already have an account? Sign in →'
                  : "Don't have an account? Sign up →"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-center mt-4">
        <div className="text-xs text-gray-400 bg-[#1E2530]/70 rounded-lg py-2 px-4 flex items-center justify-center gap-4 backdrop-blur">
          <CommandButton label="Show/Hide" shortcut="B" />
          <CommandButton label="Move" shortcut="← ↑ → ↓" />
        </div>
      </div>
      <div className="flex items-center justify-center w-full pt-3 pb-3">
        <button
          onClick={() => sendToElectron(IPC_EVENTS.TOOLTIP.CLOSE_CLICK)}
          className="flex items-center gap-1 text-[11px] text-red-400/80 hover:text-red-400 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3 h-3 text-white/60"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          <span className="text-[10px] leading-none text-white/60">Close</span>
        </button>
      </div>
    </div>
  );
}
