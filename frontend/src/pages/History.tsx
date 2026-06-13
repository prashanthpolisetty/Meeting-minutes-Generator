import { useState, useEffect } from 'react';
import { meetingApi } from '../services/api';
import { Link } from 'react-router-dom';
import { Clock, Search, ChevronRight, FileAudio } from 'lucide-react';
import { format } from 'date-fns';

export default function History() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const response = await meetingApi.getAll();
      setMeetings(response.data.meetings || []);
    } catch (error) {
      console.error("Failed to fetch meetings", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMeetings = meetings.filter(m => 
    m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.participants?.some((p: string) => p.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Meeting History</h1>
          <p className="mt-2 text-gray-600">View and search through all your processed meeting minutes.</p>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-colors"
            placeholder="Search meetings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-pulse flex space-x-4">
              <div className="h-4 w-4 bg-brand-200 rounded-full"></div>
              <div className="h-4 w-4 bg-brand-300 rounded-full"></div>
              <div className="h-4 w-4 bg-brand-400 rounded-full"></div>
            </div>
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                 <FileAudio className="w-8 h-8 text-gray-300" />
             </div>
             <p className="font-medium text-gray-900">No meetings found</p>
             <p className="text-sm mt-1">Try adjusting your search query or upload a new meeting.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Meeting Title</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Participants</th>
                  <th scope="col" className="relative px-6 py-4"><span className="sr-only">View</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMeetings.map((meeting) => (
                  <tr key={meeting._id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{meeting.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1.5" />
                        {meeting._id ? new Date().toLocaleDateString() : 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center gap-1.5
                        ${meeting.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          meeting.status === 'failed' ? 'bg-red-100 text-red-800' : 
                          'bg-amber-100 text-amber-800'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${meeting.status === 'completed' ? 'bg-green-500' : meeting.status === 'failed' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`}></span>
                        {meeting.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {meeting.participants?.length > 0 ? (
                        <div className="flex -space-x-2 overflow-hidden">
                           {meeting.participants.map((p: string, i: number) => (
                               <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold" title={p}>
                                   {p.charAt(0).toUpperCase()}
                               </div>
                           ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/meeting/${meeting._id}`} className="text-brand-600 hover:text-brand-900 flex items-center justify-end font-semibold">
                        View <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
