import { useEffect, useState } from "react";
import { db } from "../../firebase/config"; // adjust path
import { collection, doc, getDoc } from "firebase/firestore";

const TeamsFanbase = () => {
  const [sport, setSport] = useState("NFL");
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTeams = async () => {
      if (!sport) return;
      setLoading(true);

      try {
        const docRef = doc(collection(db, "teams"), sport); // sport doc (NFL, NBA, CFB, NCAAB)
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          // Convert map -> array
          const teamsArray = Object.entries(data.teams || {}).map(
            ([name, info]) => ({
              name,
              ...info,
            })
          );

          // Sort by answerCount (descending)
          const sortedTeams = teamsArray.sort(
            (a, b) => (b.answerCount || 0) - (a.answerCount || 0)
          );
          console.log(sortedTeams);

          setTeams(sortedTeams);
        } else {
          setTeams([]);
        }
      } catch (err) {
        console.error("Failed to fetch teams:", err);
        setTeams([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [sport]);

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
            <h1 className="text-3xl font-bold text-gray-900">Team Reports</h1>
            <p className="text-gray-600 mt-2">
              Sport-wise reports showing most active teams and fastest answers.
            </p>
            <select
              className="w-full border rounded-lg p-2 mt-3"
              value={sport}
              onChange={(e) => setSport(e.target.value)}
            >
              <option value="">-- Choose --</option>
              <option value="NFL">NFL</option>
              <option value="NBA">NBA</option>
              <option value="CFB">NCAAF</option>
              <option value="NCAAB">NCAAB</option>
            </select>
          </div>
        </div>

        <table className="min-w-full divide-y divide-gray-200 border">
          <thead className="bg-gray-50">
            <tr>
              <td className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SNO
              </td>
              <td className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Team Name
              </td>
              <td className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Answers Submitted
              </td>
              <td className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fastest Answer (Seconds)
              </td>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {teams.length > 0 ? (
              teams.map((team, index) => (
                <tr key={team.name}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {team.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {team.answerCount || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {team.fastestAnswer
                      ? `${team.fastestAnswer.time?.toFixed(5)}s`
                      : "N/A"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
                >
                  No teams found for this sport.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamsFanbase;
