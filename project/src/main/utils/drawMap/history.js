const cloneSnapshot = (snapshot) => {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(snapshot)
    } catch (error) {
      if (error?.name !== 'DataCloneError') {
        throw error
      }
    }
  }
  return JSON.parse(JSON.stringify(snapshot))
}

const snapshotsEqual = (left, right) => {
  return JSON.stringify(left) === JSON.stringify(right)
}

export const createMapDrawHistory = ({ limit = 50 } = {}) => {
  const undoStack = []
  const redoStack = []
  const maxEntries = Math.max(1, Number(limit) || 50)

  const trimUndoStack = () => {
    if (undoStack.length <= maxEntries) return
    undoStack.splice(0, undoStack.length - maxEntries)
  }

  return {
    canUndo() {
      return undoStack.length > 0
    },
    canRedo() {
      return redoStack.length > 0
    },
    commit(snapshot) {
      if (undoStack.length && snapshotsEqual(undoStack[undoStack.length - 1], snapshot)) {
        return
      }
      undoStack.push(cloneSnapshot(snapshot))
      trimUndoStack()
      redoStack.length = 0
    },
    undo(currentSnapshot) {
      if (!undoStack.length) return null
      const previousSnapshot = undoStack.pop()
      redoStack.push(cloneSnapshot(currentSnapshot))
      return cloneSnapshot(previousSnapshot)
    },
    redo(currentSnapshot) {
      if (!redoStack.length) return null
      const nextSnapshot = redoStack.pop()
      undoStack.push(cloneSnapshot(currentSnapshot))
      trimUndoStack()
      return cloneSnapshot(nextSnapshot)
    },
    clear() {
      undoStack.length = 0
      redoStack.length = 0
    },
    sizes() {
      return {
        undo: undoStack.length,
        redo: redoStack.length,
      }
    },
  }
}
