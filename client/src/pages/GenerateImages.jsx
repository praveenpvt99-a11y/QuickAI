import React, { useState } from 'react';
import { Image, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const GenerateImages = () => {
  const imageStyles = [
    'Realistic',
    'Ghibli style',
    'Anime style',
    'Cartoon style',
    'Fantasy style',
    '3D style',
    'Portrait style'
  ];

  const [selectedStyle, setSelectedStyle] = useState('Realistic');
  const [input, setInput] = useState('');
  const [publish, setPublish] = useState(false);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');

  const { getToken } = useAuth();

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setContent('');

      const prompt = `Generate an image of ${input} in ${selectedStyle} style.`;

      const token = await getToken();

      const { data } = await axios.post(
        '/api/ai/generate-image',
        {
          prompt,
          publish
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('IMAGE API RESPONSE:', data);
      console.log('IMAGE URL:', data.content);

      if (data.success) {
        setContent(data.content);
      } else {
        toast.error(data.message || 'Failed to generate image');
      }
    } catch (error) {
      console.error('IMAGE ERROR:', error);

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
          <Sparkles className="w-6 text-[#00AD25]" />

          <h1 className="text-xl font-semibold">
            AI Image Generator
          </h1>
        </div>

        {/* Describe Image */}
        <p className="mt-6 text-sm font-medium">
          Describe Your Image
        </p>

        <textarea
          onChange={(e) => setInput(e.target.value)}
          value={input}
          rows={4}
          className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300"
          placeholder="Describe what you want to see in the image..."
          required
        />

        {/* Style */}
        <p className="mt-4 text-sm font-medium">
          Style
        </p>

        <div className="mt-3 flex gap-3 flex-wrap">
          {imageStyles.map((item) => (
            <span
              key={item}
              onClick={() => setSelectedStyle(item)}
              className={`text-xs px-4 py-1 border rounded-full cursor-pointer transition ${
                selectedStyle === item
                  ? 'bg-green-50 text-green-700 border-green-500'
                  : 'text-gray-500 border-gray-300'
              }`}
            >
              {item}
            </span>
          ))}
        </div>

        {/* Publish Toggle */}
        <div className="my-6 flex items-center gap-2">

          <label className="relative cursor-pointer">
            <input
              type="checkbox"
              checked={publish}
              onChange={(e) => setPublish(e.target.checked)}
              className="sr-only peer"
            />

            <div className="w-9 h-5 bg-slate-300 rounded-full peer-checked:bg-green-500 transition">

              <span
                className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform ${
                  publish ? 'translate-x-4' : ''
                }`}
              />

            </div>
          </label>

          <p className="text-sm">
            Make this image Public
          </p>

        </div>

        {/* Generate Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-linear-to-r from-[#00AD25] to-[#04FF50] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer disabled:opacity-50"
        >

          {loading ? (
            <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <Image className="w-5" />
          )}

          {loading ? 'Generating...' : 'Generate Image'}

        </button>

      </form>


      {/* RIGHT COLUMN */}
      <div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96">

        {/* Heading */}
        <div className="flex items-center gap-3">

          <Image className="w-5 h-5 text-[#00AD25]" />

          <h1 className="text-xl font-semibold">
            Generated Image
          </h1>

        </div>


        {/* Loading */}
        {loading ? (

          <div className="flex-1 flex justify-center items-center">

            <div className="flex flex-col items-center gap-4 text-gray-400">

              <span className="w-10 h-10 rounded-full border-4 border-green-200 border-t-green-500 animate-spin" />

              <p className="text-sm">
                Generating your image...
              </p>

            </div>

          </div>

        ) : !content ? (

          /* Empty State */
          <div className="flex-1 flex justify-center items-center">

            <div className="text-sm flex flex-col items-center gap-5 text-gray-400">

              <Image className="w-9 h-9" />

              <p className="text-center">
                Enter a description and click "Generate Image" to get started
              </p>

            </div>

          </div>

        ) : (

          /* Generated Image */
          <div className="mt-4 flex-1 flex justify-center items-center overflow-hidden">

            <img
              src={content}
              alt="Generated"
              className="w-full h-full max-h-125 object-contain rounded-lg"
            />

          </div>

        )}

      </div>

    </div>
  );
};

export default GenerateImages;