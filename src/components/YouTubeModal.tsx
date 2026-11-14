import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface YouTubeModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
}

export const YouTubeModal: React.FC<YouTubeModalProps> = ({ isOpen, onClose, videoId }) => {
  // Lock body scroll when the video modal is active
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const extractVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return match[2];
    }
    return url;
  };

  const id = extractVideoId(videoId);

  return (
    <div
      className="fixed inset-0 w-full h-full z-[9999] flex flex-col items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md select-none overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="flex flex-col w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header row for the close button above video */}
        <div className="flex justify-end w-full pb-2">
          <button
            onClick={onClose}
            type="button"
            aria-label="Close video"
            title="Close"
            className="p-2 sm:p-2.5 bg-black/80 hover:bg-black text-white rounded-full transition-all cursor-pointer border border-white/30 shadow-lg flex items-center justify-center active:scale-95"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>
        </div>

        {/* Video player container */}
        <div className="w-full aspect-video rounded-2xl sm:rounded-3xl bg-black overflow-hidden shadow-2xl border border-white/10">
          <iframe
            className="w-full h-full border-0 block"
            src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
};
