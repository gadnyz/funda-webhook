function write(level, message, meta) {
  const entry = {
    level,
    time: new Date().toISOString(),
    message,
    ...(meta ? { meta } : {})
  };
  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
    return;
  }
  console.log(line);
}

module.exports = {
  info: (message, meta) => write("info", message, meta),
  warn: (message, meta) => write("warn", message, meta),
  error: (message, meta) => write("error", message, meta),
  debug: (message, meta) => {
    if (process.env.DEBUG) write("debug", message, meta);
  }
};
