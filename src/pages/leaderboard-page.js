import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, getDocs } from "firebase/firestore";

const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersData = [];

        usersSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          usersData.push({
            id: docSnap.id,
            name: data.displayName || data.username || "Unknown",
            totalWon: data.totalWinnings || 0,
            contestWins: data.totalWins || 0,
            championships: data.championships || 0,
            avgSpeed: data.avgSpeed || null, // ✅ average response speed (seconds/ms)
            fastestWinSpeed: data.fastestWinSpeed || null, // ✅ fastest win record
          });
        });

        // Sort by total winnings (descending)
        const sorted = usersData.sort((a, b) => b.totalWon - a.totalWon);
        setUsers(sorted);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const formatCurrency = (num) =>
    `$${num?.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatNumber = (num) =>
    num?.toLocaleString(undefined, { maximumFractionDigits: 0 });

  const formatSpeed = (num) =>
    num ? `${num.toFixed(2)}s` : "-"; // ✅ Example: 1.23s or dash if missing

  const totalPages = Math.ceil(users.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const currentUsers = users.slice(startIndex, startIndex + usersPerPage);

  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Speed Leaderboard
            </h1>
            <p className="text-gray-600 mt-2">
              Ranked by total winnings across all contests.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Total Winnings
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Contest Wins
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Championships
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Avg Speed
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Fastest Win
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {currentUsers.length > 0 ? (
                currentUsers.map((user, index) => {
                  const globalRank = startIndex + index + 1;

                  let bg = "";
                  if (globalRank === 1) bg = "bg-yellow-100 font-semibold";
                  else if (globalRank === 2) bg = "bg-gray-100";
                  else if (globalRank === 3) bg = "bg-orange-50";

                  return (
                    <tr key={user.id} className={bg}>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        #{globalRank}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">
                        {formatCurrency(user.totalWon)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">
                        {formatNumber(user.contestWins)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">
                        {formatNumber(user.championships)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">
                        {formatSpeed(user.avgSpeed)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">
                        {formatSpeed(user.fastestWinSpeed)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {users.length > 10  && (
          <div className="flex justify-center items-center mt-6 space-x-4">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-md border ${
                currentPage === 1
                  ? "text-gray-400 border-gray-200 cursor-not-allowed"
                  : "text-blue-600 border-blue-300 hover:bg-blue-50"
              }`}
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-md border ${
                currentPage === totalPages
                  ? "text-gray-400 border-gray-200 cursor-not-allowed"
                  : "text-blue-600 border-blue-300 hover:bg-blue-50"
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
