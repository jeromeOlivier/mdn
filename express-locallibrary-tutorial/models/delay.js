const delay = async (time, message) => {
  return new Promise(resolve => setTimeout(() => {
    resolve(message);
    console.log(`${message} ran!`)
  }, time));
};

const delay01 = () => delay(3, "one");
const delay02 = () => delay(2, "two");
const delay03 = () => delay(1, "three");
const delay04 = () => delay(1000, "four");

async function myFunction() {
  const result03 = await delay03();
  const [result01, result02, result04] = await Promise.all([
    delay01(),
    delay02(),
    delay04()
  ]);

  // even though three finishes before, it has to wait for one and two...
  console.log(result01, result02, result03, result04);
}

myFunction().then(() => console.log("Done!"))