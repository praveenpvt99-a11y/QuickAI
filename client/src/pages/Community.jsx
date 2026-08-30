import { useUser, useAuth } from '@clerk/clerk-react';
import React, { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const Community = () => {
  const [creations, setCreations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likeLoading, setLikeLoading] = useState(null);

  const { user } = useUser();
  const { getToken } = useAuth();

  // Fetch published creations
  const fetchCreations = async () => {
    try {
      setLoading(true);

      const token = await getToken();

      const { data } = await axios.get(
        '/api/user/get-published-creations',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('COMMUNITY RESPONSE:', data);

      if (data.success) {
        setCreations(data.creations || []);
      } else {
        toast.error(
          data.message || 'Failed to fetch creations'
        );
      }

    } catch (error) {
      console.error('FETCH CREATIONS ERROR:', error);

      toast.error(
        error.response?.data?.message ||
        error.message ||
        'Something went wrong'
      );

    } finally {
      setLoading(false);
    }
  };


  // Like / Unlike creation
  const imageLikeToggle = async (id) => {
    try {
      setLikeLoading(id);

      const token = await getToken();

      const { data } = await axios.post(
        '/api/user/toggle-like-creation',
        { id },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('LIKE RESPONSE:', data);

      if (data.success) {
        await fetchCreations();
      } else {
        toast.error(
          data.message || 'Failed to update like'
        );
      }

    } catch (error) {
      console.error('LIKE ERROR:', error);

      toast.error(
        error.response?.data?.message ||
        error.message ||
        'Something went wrong'
      );

    } finally {
      setLikeLoading(null);
    }
  };


  // Fetch when user is available
  useEffect(() => {
    if (user) {
      fetchCreations();
    }
  }, [user]);


  // Loading
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <span className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-purple-600 animate-spin" />
      </div>
    );
  }


  return (
    <div className="flex-1 h-full flex flex-col gap-4 p-6">

      <h1 className="text-xl font-semibold">
        Creations
      </h1>

      <div className="bg-white h-full w-full rounded-xl overflow-y-auto p-3">

        {creations.length === 0 ? (

          <div className="h-full flex justify-center items-center">
            <p className="text-sm text-gray-400">
              No published creations yet.
            </p>
          </div>

        ) : (

          <div className="flex flex-wrap">

            {creations.map((creation) => {

              const likes = Array.isArray(creation.likes)
                ? creation.likes
                : [];

              const isLiked = likes.includes(
                String(user?.id)
              );

              return (
                <div
                  key={creation.id}
                  className="relative group w-full sm:w-1/2 lg:w-1/3 p-2"
                >

                  <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">

                    <img
                      src={creation.content}
                      alt={creation.prompt || "Creation"}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 flex items-end justify-between p-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-linear-to-t from-black/80 via-black/20 to-transparent text-white">

                      <p className="text-sm max-w-[75%] line-clamp-3">
                        {creation.prompt}
                      </p>

                      <button
                        type="button"
                        disabled={likeLoading === creation.id}
                        onClick={() =>
                          imageLikeToggle(creation.id)
                        }
                        className="flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >

                        <span>
                          {likes.length}
                        </span>

                        <Heart
                          className={`w-5 h-5 ${
                            isLiked
                              ? 'fill-red-500 text-red-500'
                              : 'text-white'
                          }`}
                        />

                      </button>

                    </div>

                  </div>

                </div>
              );
            })}

          </div>

        )}

      </div>

    </div>
  );
};

export default Community;