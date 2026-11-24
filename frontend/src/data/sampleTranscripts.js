export const SAMPLE_TRANSCRIPTS = [
  {
    id: 'capstone-nlp',
    label: 'Capstone AI & Deployment Sprint',
    track: 'Final Year Capstone — Django & NLP Architecture',
    duration: 45,
    title: 'Capstone NLP Latency & Deployment Readiness Review',
    transcript: `Dr. Anitha Raman [00:00:14]: Good afternoon Dharshini! Let's review the final deployment readiness of your Smart Meeting Intelligence System before next week's faculty panel. How are the API response times looking?
Dharshini A [00:01:08]: Good afternoon ma'am! Our Django REST Framework endpoints average 32 milliseconds and the pure-Python TextRank plus TF-IDF summarizer completes a 1,200-word transcript in under 45 milliseconds. One blocker we noticed is handling uploaded transcript files with inconsistent speaker timestamps cleanly.
Dr. Anitha Raman [00:02:30]: Under 45 milliseconds is an impressive benchmark for an extractive NLP pipeline. How did you resolve the edge cases where transcripts use parentheses or omit timestamps entirely?
Dharshini A [00:03:22]: I added a multi-pattern regex parser with synthetic timeline estimation and graceful fallback to speaker role heuristics. My accuracy on action-item owner attribution jumped to 89 percent on our test transcripts!
Dr. Anitha Raman [00:04:40]: Excellent engineering discipline! We decided to include a live Browser Speech-to-Text capture mode alongside .txt file uploads so mentors can test real-time academic documentation during the jury demo.
Dharshini A [00:05:45]: Agreed! I will add Web Speech API live dictation with an automatic fallback notice and test cross-browser rendering by Thursday.
Dr. Anitha Raman [00:06:35]: Please also benchmark JWT token expiration handling and verify role-based confidentiality filters before Friday evening.
Dharshini A [00:07:20]: I'll run the complete security verification suite and upload our final README architecture diagram by Friday evening.
Dr. Anitha Raman [00:08:10]: I will review your live demo script and share the department evaluation rubric tomorrow morning. You are in fantastic shape for the capstone defense!`,
  },
  {
    id: 'placement-dsa',
    label: 'Placement DSA & Resume Audit',
    track: 'Career & Technical Placement Sprint',
    duration: 40,
    title: 'Technical Interview Coding Speed & Resume Audit',
    transcript: `Dr. Anitha Raman [00:00:12]: Hi Dharshini, let's check your placement preparation metrics this week — how did the mock coding round and SQL assessment go?
Dharshini A [00:01:05]: Hi ma'am! I solved all three SQL window-function queries in 18 minutes and passed 90 percent of test cases on graphs and trees. However, I got slightly stuck optimizing a hard dynamic programming state space from O(N^2) down to O(N) under tight time pressure.
Dr. Anitha Raman [00:02:25]: Your SQL speed and graph accuracy are strong strengths for full-stack and analytics roles. Let's look at your ATS resume draft — did you quantify the outcomes of your three portfolio projects?
Dharshini A [00:03:18]: Yes ma'am, I added concrete metrics for the Placement Readiness Analytics Engine and MentorSync AI, though I am worried the bullet points on my embedded IoT project still feel too descriptive rather than impact-driven.
Dr. Anitha Raman [00:04:30]: We agreed to rewrite the IoT bullets using the STAR method, emphasizing sensor telemetry latency reduction and fault recovery. Let's also prioritize timed 35-minute DP pattern drills every alternate evening.
Dharshini A [00:05:32]: That gives me a clear target! I will complete 12 space-optimized dynamic programming problems on LeetCode and document each recurrence relation within 3 days.
Dr. Anitha Raman [00:06:22]: Make sure you polish your one-page ATS resume PDF and update your GitHub pinned repositories by Wednesday.
Dharshini A [00:07:10]: I'll send the revised resume PDF and GitHub portfolio links by Wednesday afternoon.
Dr. Anitha Raman [00:07:55]: I will forward your finalized resume to our placement coordinator and schedule a 45-minute technical mock interview next Tuesday. Keep up this confident pace!`,
  },
  {
    id: 'research-vlsi',
    label: 'IEEE Paper & Semester Exam Balance',
    track: 'Research Track & Semester VII Academics',
    duration: 50,
    title: 'IEEE Manuscript Submission & Semester Exam Strategy',
    transcript: `Dr. Anitha Raman [00:00:16]: Hello Dharshini! With semester final exams three weeks away and the IEEE student conference deadline approaching, let's synchronize both academic tracks without causing burnout.
Dharshini A [00:01:15]: Thank you ma'am — balancing VLSI coursework revision, lab records, and our NLP research paper evaluation tables has felt slightly overwhelming this week. The experimental accuracy of our hybrid summarizer reached 84.6 percent F1, which is exciting, but my conference LaTeX template still has formatting errors.
Dr. Anitha Raman [00:02:45]: An 84.6 percent F1 score is a strong result! Protecting your bandwidth is critical right now so neither your 8.5 CGPA goal nor the manuscript suffers. Where is the biggest time sink?
Dharshini A [00:03:40]: Mostly debugging LaTeX two-column figure placement and preparing revision notes for Digital Signal Processing and Embedded Systems exams simultaneously.
Dr. Anitha Raman [00:04:50]: We decided to freeze new NLP model experiments immediately and lock the dataset results we already validated. Focus 70 percent of your weekday routine on semester exam revision and reserve Saturday mornings strictly for polishing the IEEE paper.
Dharshini A [00:06:00]: That relieves so much pressure! I will fix the IEEE LaTeX figure formatting and finalize the ablation study table this weekend.
Dr. Anitha Raman [00:06:55]: Please also complete two past university question papers for DSP and VLSI before next Thursday so we can review any conceptual gaps early.
Dharshini A [00:07:45]: Done ma'am, I'll solve both past exam papers by next Thursday and share my error log with you.
Dr. Anitha Raman [00:08:30]: I will proofread your complete IEEE manuscript abstract and bibliography by Monday morning. Stay calm and structured — you are handling both tracks admirably!`,
  },
];
