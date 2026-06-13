import { useState, useRef } from 'react';
import { UploadCloud, FileAudio, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { meetingApi } from '../../services/api';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function UploadWidget() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [participants, setParticipants] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith('audio/')) {
        setFile(droppedFile);
        if (!title) setTitle(droppedFile.name.split('.')[0]);
      } else {
        setError("Please upload an audio file (.mp3, .wav, etc)");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!title) setTitle(selectedFile.name.split('.')[0]);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select an audio file first.");
      return;
    }
    if (!title) {
      setError("Please provide a title for the meeting.");
      return;
    }

    setIsUploading(true);
    setError("");

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('participants', participants);

    try {
      const response = await meetingApi.upload(formData);
      // Backend returns {"message": "...", "meeting_id": "..."}
      const meetingId = response.data.meeting_id;
      // Navigate to the meeting details view
      navigate(`/meeting/${meetingId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "An error occurred during upload.");
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">New Meeting Upload</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Upload the audio recording of your meeting to automatically generate minutes.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl flex items-start gap-3 border border-red-100 dark:border-red-800">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
                <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Meeting Title <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.g., Q3 Planning Session"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                               placeholder-gray-400 dark:placeholder-gray-500
                               focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                />
                </div>
                
                <div>
                <label htmlFor="participants" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Participants (comma separated)
                </label>
                <input
                    type="text"
                    id="participants"
                    value={participants}
                    onChange={(e) => setParticipants(e.target.value)}
                    placeholder="john@example.com, alice@example.com"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                               placeholder-gray-400 dark:placeholder-gray-500
                               focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Audio File <span className="text-red-500">*</span>
                </label>
                <div
                    className={twMerge(
                        clsx(
                            "mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-colors h-[134px] cursor-pointer",
                            isDragging
                              ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                              : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-700/50"
                        )
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="space-y-1 text-center">
                    {file ? (
                        <div className="flex flex-col items-center justify-center">
                            <CheckCircle2 className="mx-auto h-8 w-8 text-green-500" />
                            <p className="mt-2 text-sm text-gray-800 dark:text-gray-200 font-medium">{file.name}</p>
                            <p className="text-xs text-brand-600 dark:text-indigo-400 font-semibold mt-1 hover:underline">Change file</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center">
                            <UploadCloud className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500" />
                            <div className="flex text-sm text-gray-600 dark:text-gray-400 mt-2">
                                <span className="font-semibold text-brand-600 dark:text-indigo-400 hover:text-brand-500">Upload a file</span>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">MP3, WAV up to 100MB</p>
                        </div>
                    )}
                    </div>
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="audio/*"
                    onChange={handleFileSelect}
                />
            </div>
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
          <button
            type="submit"
            disabled={isUploading || !file}
            className={twMerge(
                clsx(
                    "flex items-center justify-center px-6 py-2.5 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all",
                    (isUploading || !file) && "opacity-60 cursor-not-allowed hover:bg-brand-600"
                )
            )}
          >
            {isUploading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Uploading & Processing...
              </>
            ) : (
              <>
                <FileAudio className="-ml-1 mr-2 h-5 w-5" />
                Generate Minutes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

