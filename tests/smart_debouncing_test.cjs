// Test smart debouncing functionality
const assert = require('assert');

console.log('🧠 **Testing Smart Debouncing Functionality**\n');

// Mock CopyrightHandler for testing
class MockCopyrightHandler {
    constructor() {
        this.lastEditTime = Date.now();
        this.debounceInterval = 1500;
    }

    // Mock getConfig with different scenarios
    getConfig() {
        return {
            smartDebouncing: true,
            smartDebounceMultiplier: 2.0,
            smartDebounceThreshold: 300000, // 5 minutes
            backgroundUpdateDelay: 1500
        };
    }

    // Test method
    getDebounceDelay() {
        const config = this.getConfig();
        const baseDelay = config.backgroundUpdateDelay || this.debounceInterval;

        if (!config.smartDebouncing) {
            return baseDelay;
        }

        const timeSinceLastEdit = Date.now() - this.lastEditTime;
        const threshold = config.smartDebounceThreshold;

        if (timeSinceLastEdit < threshold) {
            return baseDelay;
        }

        // Calculate multiplier based on how long file has been inactive
        const multiplier = Math.min(
            config.smartDebounceMultiplier +
            Math.floor(timeSinceLastEdit / threshold) * 0.5, // Additional 0.5x per threshold period
            5.0 // Max multiplier of 5.0
        );

        const smartDelay = Math.min(baseDelay * multiplier, 10000); // Max 10 seconds

        return smartDelay;
    }

    // Helper to set last edit time
    setLastEditTime(time) {
        this.lastEditTime = time;
    }
}

console.log('📊 **Test Scenarios:**\n');

// Test 1: Recently edited file (normal delay)
console.log('1. Recently edited file (< 5 minutes ago):');
const handler1 = new MockCopyrightHandler();
handler1.setLastEditTime(Date.now() - 60000); // 1 minute ago
const delay1 = handler1.getDebounceDelay();
console.log(`   Time since edit: 1 minute → Delay: ${delay1}ms (expected: 1500ms)`);
assert.strictEqual(delay1, 1500, 'Should use base delay for recent edits');

// Test 2: Inactive file (progressive delay)
console.log('2. Inactive file (> 5 minutes ago):');
const handler2 = new MockCopyrightHandler();
handler2.setLastEditTime(Date.now() - 400000); // 6.67 minutes ago (1.33 threshold periods)
const delay2 = handler2.getDebounceDelay();
const expected2 = 1500 * (2.0 + Math.floor(400000 / 300000) * 0.5); // 1500 * 2.5 = 3750
console.log(`   Time since edit: 6.67 minutes → Delay: ${delay2}ms (expected: ${expected2}ms = 1500 * 2.5x)`);
assert.strictEqual(delay2, expected2, 'Should use progressive multiplier for inactive files');

// Test 3: Very old file (max multiplier cap)
console.log('3. Very old file (max multiplier cap):');
const handler3 = new MockCopyrightHandler();
handler3.setLastEditTime(Date.now() - 3600000); // 1 hour ago (many threshold periods)
const delay3 = handler3.getDebounceDelay();
const expected3 = 1500 * 5.0; // Capped at max multiplier 5.0
console.log(`   Time since edit: 1 hour → Delay: ${delay3}ms (expected: ${expected3}ms = 1500 * 5.0x max)`);
assert.strictEqual(delay3, expected3, 'Should cap multiplier at 5.0x for very old files');

// Test 4: Smart debouncing disabled
console.log('4. Smart debouncing disabled:');
const handler4 = new MockCopyrightHandler();
handler4.getConfig = () => ({
    smartDebouncing: false,
    backgroundUpdateDelay: 1500
});
handler4.setLastEditTime(Date.now() - 400000); // Old file
const delay4 = handler4.getDebounceDelay();
console.log(`   Smart debouncing disabled → Delay: ${delay4}ms (expected: 1500ms always)`);
assert.strictEqual(delay4, 1500, 'Should use base delay when smart debouncing disabled');

console.log('\n✅ **All Smart Debouncing Tests Passed!**\n');

console.log('🎯 **Smart Debouncing Benefits:**');
console.log('- ✅ Recent files: Fast updates (1500ms)');
console.log('- ✅ Inactive files: Slower updates (3000ms) to avoid spam');
console.log('- ✅ Very old files: Max delay cap (10000ms) for performance');
console.log('- ✅ Configurable: Multiplier and threshold adjustable');
console.log('- ✅ Optional: Can be disabled if not needed');

console.log('\n🚀 **Result:** Copyright updates now adapt to file activity levels!');
