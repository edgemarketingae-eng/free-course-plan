# Edge Free Course Roadmap

Edge Trading Academy's free course roadmap, built from the "Edge Roadmap" FigJam board:
Growth Hub leads → equal split to 4 sales people → 7-class free course (account opened,
deposit confirmed) → Inner Circle → weekly follow-up and daily status → Premium Course,
Wealth Circle, F1 Club, plus the marketing loop back to new leads.

Click any box on the chart to jump to its detailed card: owner, timing, team actions,
done-when checks, scripts and the numbers to watch.

Static single page (`index.html`), deployed on Vercel, behind a password-only login (`middleware.js`).
Only a SHA-256 hash of the password is stored. A wrong password redirects to https://join.edgeacademy.ae/.
Sign out at `/__logout`.
Old `/roadmap.html` links redirect to `/`. No build step.
