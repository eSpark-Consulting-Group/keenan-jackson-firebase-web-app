import { useState } from "react";

export default function RestrictedAlert() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  const handleClose = () => {
    setFading(true);
    setTimeout(() => setVisible(false), 500); // matches Tailwind duration
  };

  if (!visible) return null;

  return (
    <div
      className={`bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative my-3 transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
      role="alert"
      title="Square Trivia paid contests are not available in Arizona (AZ), Tennessee (TN), Maryland (MD), and Louisiana (LA)."
    >
      <span className="block sm:inline">
        Square Trivia paid contests are not available in AZ, TN, MD, or LA.
      </span>
      <span
        className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer"
        onClick={handleClose}
      >
        <svg
          className="fill-current h-6 w-6 text-red-500"
          role="button"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <title>Close</title>
          <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
        </svg>
      </span>
    </div>
  );
}
