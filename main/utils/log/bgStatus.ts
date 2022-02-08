function express(message: any) {
  this.prefix = `[EXPRESS]`;
  console.log(this.prefix, message);
}

function auth(message: any) {
  this.prefix = `[AUTH]`;
  console.log(this.prefix, message);
}

export { express, auth };
