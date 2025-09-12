import { useEffect, useState } from "react";
import { db } from "../../firebase/config"; // adjust path
import { collection, getDocs } from "firebase/firestore";

const ReferralReports = () => {
  const [loading, setLoading] = useState(false);
  const [referralReport, setReferralReport] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getReferralSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch all users
        const usersSnap = await getDocs(collection(db, "users"));
        const users = usersSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // 2. Fetch all donations
        const donationsSnap = await getDocs(collection(db, "donations"));
        const donations = donationsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // 3. Build referral summary
        const referrers = users.filter(
          (u) => u.referralCode && u.referralCode.trim() !== ""
        );

        let summary = referrers.map((referrer) => {
          // find users who used this referrer’s code
          const referredUsers = users.filter(
            (u) => u.referredBy === referrer.referralCode
          );

          // for each referred user, check if they have any successful donation
          const referredWithConversion = referredUsers.map((u) => {
            const userDonations = donations.filter(
              (d) => d.userId === u.id && d.status === "completed"
            );
            return {
              ...u,
              hasConverted: userDonations.length > 0,
            };
          });

          const signupCount = referredUsers.length;
          const conversionCount = referredWithConversion.filter(
            (u) => u.hasConverted
          ).length;

          // payment calculation
          const amountEarned = conversionCount * 3;
          const amountPaid = referrer.amountPaid || 0;
          const amountPending = amountEarned - amountPaid;

          return {
            userId: referrer.id,
            referralCode: referrer.referralCode,
            signupCount,
            conversionCount,
            amountEarned,
            amountPaid,
            amountPending,
            referredUsers: referredWithConversion.map((u) => ({
              id: u.id,
              referralCode: u.referralCode || null,
              hasConverted: u.hasConverted,
            })),
          };
        });

        // ✅ Only include referrers with at least 1 signup
        summary = summary.filter((item) => item.signupCount >= 1);

        setReferralReport(summary);
      } catch (err) {
        console.error("Error fetching referral summary:", err);
        setError("Failed to fetch referral report. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    getReferralSummary();
  }, []);

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
              Referral Summary
            </h1>
            <p className="text-gray-600 mt-2">
              Track signups, conversions, and payouts from referral codes.
            </p>
          </div>
        </div>

        <table className="min-w-full divide-y divide-gray-200 border">
          <thead className="bg-gray-50">
            <tr>
              <td className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SNO
              </td>
              <td className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Referral Code
              </td>
              <td className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Signup
              </td>
              <td className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Conversion
              </td>
              <td className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount Earned (3 X Conversion)
              </td>
              <td className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount Pending
              </td>
              <td className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount Paid
              </td>
              <td className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </td>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {referralReport.length > 0 ? (
              referralReport.map((item, index) => (
                <tr key={item?.referralCode}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item?.referralCode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item?.signupCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item?.conversionCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Number(item?.conversionCount) * 3}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item?.amountPending}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item?.amountPaid}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <button
                      className={`bg-blue-600 text-white hover:bg-blue-700 hover:text-white px-4 py-2`}
                    >
                      Mark Paid
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
                >
                  No referral code found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReferralReports;
