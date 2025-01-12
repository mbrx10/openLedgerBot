export function generateRandomCapacity() {
    function getRandomFloat(min, max, decimals = 2) {
        return (Math.random() * (max - min) + min).toFixed(decimals);
    }

    return {
        AvailableMemory: parseFloat(getRandomFloat(10, 64)),
        AvailableStorage: getRandomFloat(10, 500),
        AvailableGPU: '',
        AvailableModels: []
    };
} 