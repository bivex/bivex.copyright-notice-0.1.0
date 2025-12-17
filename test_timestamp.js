// Test timestamp update logic
const fs = require('fs');

console.log('Testing timestamp update logic...\n');

// Test cases (2 minutes threshold)
const testCases = [
    '2025-12-16 10:30', // Yesterday - should update
    '2025-12-17 08:10', // Today, 5+ minutes ago - should update
    '2025-12-17 08:13', // Today, 2 minutes ago - should NOT update
    '2025-12-17 08:14', // Today, 1 minute ago - should NOT update
    '2025-12-18 10:30', // Tomorrow - should update
    '2023-01-01 12:00', // Old date - should update
    'invalid date',     // Invalid - should update
    '2025-12-17',       // Date only - should update
];

function isTimestampOutdated(timestampText) {
    try {
        // Parse the full timestamp (YYYY-MM-DD HH:mm)
        const fullTimestampMatch = timestampText.match(/(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})/);

        if (!fullTimestampMatch) {
            // Fallback to date-only matching
            const dateMatch = timestampText.match(/(\d{4}-\d{2}-\d{2})/);
            if (!dateMatch) {
                return true;
            }
            // If only date is found, update it (old format)
            return true;
        }

        const [, dateStr, timeStr] = fullTimestampMatch;
        const [hours, minutes] = timeStr.split(':').map(Number);

        const timestampDate = new Date(dateStr);
        timestampDate.setHours(hours, minutes, 0, 0);

        // Use fixed test time instead of current time
        const now = testNow;

        // Update if timestamp is older than 2 minutes OR from a different day
        const diffMs = now - timestampDate;
        const diffMinutes = diffMs / (1000 * 60);
        const isDifferentDay = timestampDate.toDateString() !== now.toDateString();

        return diffMinutes > 2 || isDifferentDay;
    } catch (error) {
        // If we can't parse the timestamp, consider it outdated
        return true;
    }
}

// Fixed test time: 2025-12-17 08:15:00
const testNow = new Date('2025-12-17T08:15:00');
console.log('Test time:', testNow.toISOString());
console.log('');

testCases.forEach(testCase => {
    const result = isTimestampOutdated(testCase);
    console.log(`"${testCase}" -> ${result ? 'UPDATE NEEDED' : 'CURRENT'}`);
});

console.log('\n✅ Timestamp test completed!');
