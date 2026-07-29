const state = {};

// 🔥 Check + update state
function hasStateChanged(key, newState) {
    if (state[key] === newState) {
        return false; // no change
    }

    state[key] = newState;
    return true; // changed
}

// 🔥 RESET function (IMPORTANT)
function resetState(key) {
    delete state[key];
}

module.exports = {
    hasStateChanged,
    resetState
};