import { FileText, Sparkles } from 'lucide-react';
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';
import Markdown from 'react-markdown';

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const ReviewResume = () => {
  const [input, setInput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');

  const { getToken } = useAuth();

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    // Check whether a file was selected
    if (!input) {
      toast.error('Please select a PDF resume');
      return;
    }

    // Check file size on frontend as well
    if (input.size > 5 * 1024 * 1024) {
      toast.error('Resume file size exceeded (5MB)');
      return;
    }

    try {
      setLoading(true);
      setContent('');

      // Create FormData
      const formData = new FormData();

      formData.append('resume', input);

      // Get Clerk token
      const token = await getToken();

      // Send request to backend
      const { data } = await axios.post(
        '/api/ai/resume-review',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('RESUME REVIEW RESPONSE:', data);
      console.log('REVIEW CONTENT:', data.content);

      if (data.success) {
        setContent(data.content);
        toast.success('Resume reviewed successfully!');
      } else {
        toast.error(
          data.message || 'Failed to review resume'
        );
      }

    } catch (error) {
      console.error('RESUME REVIEW ERROR:', error);

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

          <Sparkles className="w-6 text-[#00DA83]" />

          <h1 className="text-xl font-semibold">
            Resume Review
          </h1>

        </div>


        {/* Upload Resume */}
        <p className="mt-6 text-sm font-medium">
          Upload resume
        </p>

        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setInput(e.target.files?.[0] || null)}
          className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300 text-gray-600"
          required
        />

        <p className="text-xs text-gray-500 font-light mt-1">
          Supports PDF resume only. Maximum size: 5MB.
        </p>


        {/* Review Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-linear-to-r from-[#00DA83] to-[#009BB3] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer disabled:opacity-50"
        >

          {loading ? (
            <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <FileText className="w-5" />
          )}

          {loading ? 'Reviewing...' : 'Review Resume'}

        </button>

      </form>


      {/* RIGHT COLUMN */}
      <div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96 max-h-150">

        {/* Heading */}
        <div className="flex items-center gap-3">

          <FileText className="w-5 h-5 text-[#00DA83]" />

          <h1 className="text-xl font-semibold">
            Analysis Results
          </h1>

        </div>


        {/* Loading */}
        {loading ? (

          <div className="flex-1 flex justify-center items-center">

            <div className="flex flex-col items-center gap-4 text-gray-400">

              <span className="w-10 h-10 rounded-full border-4 border-green-200 border-t-green-500 animate-spin" />

              <p className="text-sm">
                Analyzing your resume...
              </p>

            </div>

          </div>

        ) : !content ? (

          /* Empty State */
          <div className="flex-1 flex justify-center items-center">

            <div className="text-sm flex flex-col items-center gap-5 text-gray-400">

              <FileText className="w-9 h-9" />

              <p className="text-center">
                Upload a resume and click "Review Resume" to get started
              </p>

            </div>

          </div>

        ) : (

          /* Analysis Results */
          <div className="mt-4 flex-1 overflow-y-auto text-sm text-slate-600">

            <div className="reset-tw">
              <Markdown>
                {content}
              </Markdown>
            </div>

          </div>

        )}

      </div>

    </div>
  );
};

export default ReviewResume;