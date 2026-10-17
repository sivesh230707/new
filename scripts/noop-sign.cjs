module.exports = async function noopSign() {
  // Custom no-op signing hook to skip winCodeSign darwin symlink error on Windows
  return Promise.resolve();
};
