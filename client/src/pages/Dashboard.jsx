import React, { useState, useEffect } from 'react';
import { Gem, Sparkles } from 'lucide-react';
import CreationItem from '../components/CreationItem';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { toast } from 'react-hot-toast';

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const Dashboard = () => {
  const [creations, setCreations] = useState([]);
  const [loading, setLoading] = useState(true);

  const { getToken } = useAuth();

  const getDashboardData = async () => {
    try {
      setLoading(true);

      // Get Clerk token
      const token = await getToken();

      // Get user's creations
      const { data } = await axios.get(
        '/api/user/get-user-creations',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('DASHBOARD RESPONSE:', data);

      if (data.success) {
        setCreations(data.creations || []);
      } else {
        toast.error(
          data.message || 'Failed to fetch creations'
        );
      }

    } catch (error) {
      console.error('DASHBOARD ERROR:', error);

      toast.error(
        error.response?.data?.message ||
        error.message ||
        'Something went wrong'
      );

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDashboardData();
  }, []);

  return (
    <div className="h-full overflow-y-scroll p-6">

      {/* Cards */}
      <div className="flex justify-start gap-4 flex-wrap">

        {/* Total Creations */}
        <div className="flex justify-between items-center w-72 p-4 px-6 bg-white rounded-xl border border-gray-200">

          <div>
            <p className="text-sm text-gray-600">
              Total Creations
            </p>

            <h2 className="text-xl font-semibold">
              {creations.length}
            </h2>
          </div>

          <div className="w-10 h-10 rounded-lg bg-linear-to-br from-[#3588F2] to-[#0BB0D7] text-white flex justify-center items-center">

            <Sparkles className="w-5 h-5 text-white" />

          </div>

        </div>


        {/* Active Plan */}
        <div className="flex justify-between items-center w-72 p-4 px-6 bg-white rounded-xl border border-gray-200">

          <div>
            <p className="text-sm text-gray-600">
              Active Plan
            </p>

            <h2 className="text-xl font-semibold">
              Premium
            </h2>
          </div>

          <div className="w-10 h-10 rounded-lg bg-linear-to-br from-[#FF61C5] to-[#9E53EE] text-white flex justify-center items-center">

            <Gem className="w-5 h-5 text-white" />

          </div>

        </div>

      </div>


      {/* Recent Creations */}

      {loading ? (

        <div className="flex justify-center items-center h-3/4">

          <div className="animate-spin rounded-full h-11 w-11 border-4 border-purple-500 border-t-transparent" />

        </div>

      ) : (

        <div className="space-y-3">

          <p className="mt-6 mb-4">
            Recent Creations
          </p>

          {creations.length === 0 ? (

            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">

              <p className="text-sm">
                No creations yet.
              </p>

            </div>

          ) : (

            creations.map((item) => (
              <CreationItem
                key={item.id}
                item={item}
              />
            ))

          )}

        </div>

      )}

    </div>
  );
};

export default Dashboard;