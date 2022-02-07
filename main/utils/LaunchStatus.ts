function log(message: any) {
  this.prefix = `LaunchStatus:`;
  console.log(this.prefix, message);
}

export { log };
