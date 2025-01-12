export const createHeartbeat = (identity, address, capacity) => ({
    "message": {
        "Worker": {
            "Identity": identity,
            "ownerAddress": address,
            "type": "LWEXT",
            "Host": "chrome-extension://ekbbplmjjgoobhdlffmgeokalelnmjjc"
        },
        Capacity: capacity
    },
    "msgType": "HEARTBEAT",
    "workerType": "LWEXT", 
    "workerID": identity
});

export const createRegWorkerID = (identity, address, id) => ({
    "workerID": identity,
    "msgType": "REGISTER",
    "workerType": "LWEXT",
    "message": {
        "id": id,
        "type": "REGISTER",
        "worker": {
            "host": "chrome-extension://ekbbplmjjgoobhdlffmgeokalelnmjjc",
            "identity": identity,
            "ownerAddress": address,
            "type": "LWEXT"
        }
    }
}); 