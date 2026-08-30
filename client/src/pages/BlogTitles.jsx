import React, { useState } from 'react';
import { Hash, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const BlogTitles = () => {
  const blogCategories = [
    'General',
    'Technology',
    'Business',
    'Health',
    'Lifestyle',
    'Education',
    'Travel',
    'Food'
  ];

  const [selectedCategory, setSelectedCategory] = useState('General');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');

  const { getToken } = useAuth();

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setContent('');

      const prompt = `Generate 5 blog titles about "${input}" in the "${selectedCategory}" category.

Return only the 5 titles.
Put each title on a separate line.
Do not add explanations.`;

      const token = await getToken();

      const { data } = await axios.post(
        '/api/ai/generate-blog-title',
        { prompt },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('API RESPONSE:', data);
      console.log('CONTENT:', data.content);

      if (data.success) {
        setContent(data.content);
      } else {
        toast.error(data.message || 'Something went wrong');
      }

    } catch (error) {
      console.error('ERROR:', error);

      toast.error(
        error.response?.data?.message ||
        error.message ||
        'Something went wrong'
      );

    } finally {
      setLoading(false);
    }
  };

  // Convert AI response into clean title list
  const titles = content
    ? content
        .split('\n')
        .map((title) =>
          title
            .replace(/^\s*[-*•]\s*/, '')
            .replace(/^\s*\d+[\.\)]\s*/, '')
            .replace(/\*\*/g, '')
            .trim()
        )
        .filter(Boolean)
        .slice(0, 5)
    : [];

  return (
    <div className="h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700">

      {/* LEFT COLUMN */}
      <form
        onSubmit={onSubmitHandler}
        className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200"
      >

        <div className="flex items-center gap-3">
          <Sparkles className="w-6 text-[#8E37EB]" />

          <h1 className="text-xl font-semibold">
            AI Title Generator
          </h1>
        </div>

        {/* Keyword */}
        <p className="mt-6 text-sm font-medium">
          Keyword
        </p>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300"
          placeholder="The future of artificial intelligence is..."
          required
        />

        {/* Category */}
        <p className="mt-4 text-sm font-medium">
          Category
        </p>

        <div className="mt-3 flex gap-3 flex-wrap">

          {blogCategories.map((item) => (
            <span
              key={item}
              onClick={() => setSelectedCategory(item)}
              className={`text-xs px-4 py-1 border rounded-full cursor-pointer ${
                selectedCategory === item
                  ? 'bg-purple-50 text-purple-700 border-purple-500'
                  : 'text-gray-500 border-gray-300'
              }`}
            >
              {item}
            </span>
          ))}

        </div>

        {/* Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-linear-to-r from-[#C341F6] to-[#8E37EB] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer disabled:opacity-50"
        >

          {loading ? (
            <span className="w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate-spin"></span>
          ) : (
            <Hash className="w-5" />
          )}

          {loading ? 'Generating...' : 'Generate Title'}

        </button>

      </form>


      {/* RIGHT COLUMN */}
      <div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96">

        <div className="flex items-center gap-3">

          <Hash className="w-5 h-5 text-[#8E37EB]" />

          <h1 className="text-xl font-semibold">
            Generated Titles
          </h1>

        </div>


        {/* Empty State */}
        {!content ? (

          <div className="flex-1 flex justify-center items-center">

            <div className="text-sm flex flex-col items-center gap-5 text-gray-400">

              <Hash className="w-9 h-9" />

              <p>
                Enter a topic and click "Generate Title" to get started
              </p>

            </div>

          </div>

        ) : (

          /* Titles */
          <div className="mt-5 flex-1 overflow-y-auto">

            <ol className="space-y-4">

              {titles.map((title, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-sm text-slate-700"
                >

                  <span className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-purple-100 text-purple-700 font-semibold">
                    {index + 1}
                  </span>

                  <span className="pt-1 leading-6">
                    {title}
                  </span>

                </li>
              ))}

            </ol>

          </div>

        )}

      </div>

    </div>
  );
};

export default BlogTitles;