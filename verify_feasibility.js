const start = new Date('2026-04-13');
const end = new Date('2026-07-28');
let days = 0;
for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    // 0=Sun, 1=Mon. Open: Tue(2)-Sat(6)
    if (day >= 2 && day <= 6) {
        days++;
    }
}
console.log(`Total available days: ${days}`);
const requiredSessions = 100 * 4; // 100 students * (21 / 5.25)
const capacityPerDay = 5;
const daysNeeded = requiredSessions / capacityPerDay;
console.log(`Days needed: ${daysNeeded}`);
console.log(`Feasible: ${days >= daysNeeded}`);
