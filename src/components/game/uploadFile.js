import Papa from "papaparse";
import { collection, addDoc } from "firebase/firestore";
import { db, collections } from "../../firebase/config"; // adjust path
import toast from "react-hot-toast";

const VALID_SPORTS = ["NFL", "NBA", "CFB", "NCAA_BASKETBALL"];
const VALID_CATEGORIES = [
  "Rules & Regulations",
  "Team History",
  "Player Statistics",
  "Records & Achievements",
  "Current Season",
  "Classic Games",
];
const VALID_DIFFICULTIES = ["all", "easy", "medium", "hard", "expert"];

export const bulkUploadQuestions = async (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        try {
          const rows = result.data;
          let savedCount = 0;
          let skippedCount = 0;

          for (const [index, row] of rows.entries()) {
            // ✅ Check required fields
            if (
              !row.question ||
              !row.correctAnswer ||
              !row.wrongAnswer1 ||
              !row.wrongAnswer2 ||
              !row.wrongAnswer3 ||
              !row.sport ||
              !row.category ||
              !row.difficulty ||
              !row.timeLimit ||
              !row.points ||
              !row.explanation
            ) {
              console.warn(
                `Skipping row ${index + 1}: Missing required fields`,
                row
              );
              skippedCount++;
              continue;
            }

            // ✅ Validate enums
            if (!VALID_SPORTS.includes(row.sport.trim())) {
              console.warn(
                `Skipping row ${index + 1}: Invalid sport '${row.sport}'`
              );
              skippedCount++;
              continue;
            }

            if (!VALID_CATEGORIES.includes(row.category.trim())) {
              console.warn(
                `Skipping row ${index + 1}: Invalid category '${row.category}'`
              );
              skippedCount++;
              continue;
            }

            if (
              !VALID_DIFFICULTIES.includes(row.difficulty.trim().toLowerCase())
            ) {
              console.warn(
                `Skipping row ${index + 1}: Invalid difficulty '${row.difficulty}'`
              );
              skippedCount++;
              continue;
            }

            // ✅ Build Firestore object
            const questionData = {
              question: row.question.trim(),
              answers: [
                { text: row.correctAnswer.trim(), isCorrect: true },
                { text: row.wrongAnswer1.trim(), isCorrect: false },
                { text: row.wrongAnswer2.trim(), isCorrect: false },
                { text: row.wrongAnswer3.trim(), isCorrect: false },
              ].sort(() => Math.random() - 0.5),
              sport: row.sport.trim(),
              category: row.category.trim(),
              difficulty: row.difficulty.trim().toLowerCase(),
              timeLimit: Number(row.timeLimit),
              points: Number(row.points),
              explanation: row.explanation.trim(),
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            await addDoc(collection(db, collections.trivia), questionData);
            savedCount++;
          }

          toast.success(
            `Upload complete: ${savedCount} saved, ${skippedCount} skipped`
          );
          resolve();
        } catch (error) {
          console.error("Bulk upload failed:", error);
          toast.error("Bulk upload failed");
          reject(error);
        }
      },
      error: (err) => reject(err),
    });
  });
};
