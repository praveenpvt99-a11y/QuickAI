import { Eraser, Sparkles } from 'lucide-react';
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const RemoveBackground = () => {
  const [input, setInput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');

  const { getToken } = useAuth();

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!input) {
      toast.error('Please select an image');
      return;
    }

    try {
      setLoading(true);
      setContent('');

      // Create FormData
      const formData = new FormData();
      formData.append('image', input);

      // Get Clerk token
      const token = await getToken();

      // Send image to backend
      const { data } = await axios.post(
        '/api/ai/remove-image-background',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('BACKGROUND REMOVAL RESPONSE:', data);
      console.log('PROCESSED IMAGE:', data.content);

      if (data.success) {
        setContent(data.content);
        toast.success('Background removed successfully!');
      } else {
        toast.error(
          data.message || 'Failed to remove background'
        );
      }

    } catch (error) {
      console.error('BACKGROUND REMOVAL ERROR:', error);

      toast.error(
        error.response?.data?.message ||
        error.message ||
        'Something went wrong'
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700">

      {/* LEFT COLUMN */}

      <form
        onSubmit={onSubmitHandler}
        className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200"
      >

        {/* Heading */}

        <div className="flex items-center gap-3">

          <Sparkles className="w-6 text-[#FF4938]" />

          <h1 className="text-xl font-semibold">
            Background Removal
          </h1>

        </div>


        {/* Upload */}

        <p className="mt-6 text-sm font-medium">
          Upload image
        </p>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setInput(e.target.files?.[0] || null)}
          className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300 text-gray-600"
          required
        />

        <p className="text-xs text-gray-500 font-light mt-1">
          Supports JPG, PNG, and other image formats
        </p>


        {/* Remove Background Button */}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-linear-to-r from-[#F6AB41] to-[#FF4938] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer disabled:opacity-50"
        >

          {loading ? (
            <span className="w-4 h-4 my-1 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <Eraser className="w-5" />
          )}

          {loading ? 'Processing...' : 'Remove background'}

        </button>

      </form>


      {/* RIGHT COLUMN */}

      <div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96">

        {/* Heading */}

        <div className="flex items-center gap-3">

          <Eraser className="w-5 h-5 text-[#FF4938]" />

          <h1 className="text-xl font-semibold">
            Processed Image
          </h1>

        </div>


        {/* Loading */}

        {loading ? (

          <div className="flex-1 flex justify-center items-center">

            <div className="flex flex-col items-center gap-4 text-gray-400">

              <span className="w-10 h-10 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin" />

              <p className="text-sm">
                Removing background...
              </p>

            </div>

          </div>

        ) : !content ? (

          /* Empty State */

          <div className="flex-1 flex justify-center items-center">

            <div className="text-sm flex flex-col items-center gap-5 text-gray-400">

              <Eraser className="w-9 h-9" />

              <p className="text-center">
                Upload an image and click "Remove Background" to get started
              </p>

            </div>

          </div>

        ) : (

          /* Processed Image */

          <div className="mt-4 flex-1 flex justify-center items-center overflow-hidden">

            <img
              src={content}
              alt="Background removed"
              className="w-full max-h-125 object-contain rounded-lg"
            />

          </div>

        )}

      </div>

    </div>
  );
};

export default RemoveBackground;