const followUpCalc = {

  calculate() {

    const intervalValue = document.getElementById("fu-intervalValue");
    const intervalType = document.getElementById("fu-intervalType");
    const resultBox = document.getElementById("fu-result");

    if (!intervalValue || !intervalType || !resultBox) return;

    let value = parseInt(intervalValue.value);

    if (isNaN(value) || value <= 0) {
      resultBox.className = "result warn";
      resultBox.textContent = "Enter valid interval.";
      resultBox.classList.remove("hidden");
      return;
    }

    // ALWAYS take fresh system date
    let baseDate = new Date();

    if (intervalType.value === "weeks") {
      baseDate.setDate(baseDate.getDate() + (value * 7));
    }
    else if (intervalType.value === "months") {
      baseDate.setMonth(baseDate.getMonth() + value);
    }

    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    resultBox.className = "result success";
    resultBox.innerHTML =
      "<strong>Follow-Up Date:</strong><br>" +
      baseDate.toLocaleDateString(undefined, options);

    resultBox.classList.remove("hidden");
  },

  init() {

    const intervalValue = document.getElementById("fu-intervalValue");
    const intervalType = document.getElementById("fu-intervalType");

    if (!intervalValue || !intervalType) return;

    // Auto calculate on change
    intervalValue.addEventListener("input", () => this.calculate());
    intervalType.addEventListener("change", () => this.calculate());

    // Initial auto render
    this.calculate();
  }

};

document.addEventListener("DOMContentLoaded", function() {
  followUpCalc.init();
});
