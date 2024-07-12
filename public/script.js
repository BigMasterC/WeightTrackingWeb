document.addEventListener('DOMContentLoaded', () => {
  const userForm = document.getElementById('user-form');
  const resultsSection = document.getElementById('results');
  const weightForm = document.getElementById('weight-form');
  const weightChart = document.getElementById('weight-chart');
  
  let weightData = [];
  let chart;

  userForm.addEventListener('submit', (e) => {
      e.preventDefault();
      calculateMetrics();
  });

  weightForm.addEventListener('submit', (e) => {
      e.preventDefault();
      logWeight();
  });

  function calculateMetrics() {
    const age = parseInt(document.getElementById('age').value);
    const gender = document.getElementById('gender').value;
    const heightFeet = parseInt(document.getElementById('height-feet').value);
    const heightInches = parseInt(document.getElementById('height-inches').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const activity = parseFloat(document.getElementById('activity').value);
    const goal = document.getElementById('goal').value;

    // Convert height to centimeters and weight to kilograms
    const heightCm = (heightFeet * 12 + heightInches) * 2.54;
    const weightKg = weight * 0.453592;

    let bmr;
    if (gender === 'male') {
        bmr = 88.362 + (13.397 * weightKg) + (4.799 * heightCm) - (5.677 * age);
    } else {
        bmr = 447.593 + (9.247 * weightKg) + (3.098 * heightCm) - (4.330 * age);
    }

    const tdee = bmr * activity;
    let recommendedCalories;

    switch (goal) {
        case 'lose':
            recommendedCalories = tdee - 500;
            break;
        case 'maintain':
            recommendedCalories = tdee;
            break;
        case 'gain':
            recommendedCalories = tdee + 500;
            break;
    }

    document.getElementById('bmr').textContent = Math.round(bmr);
    document.getElementById('tdee').textContent = Math.round(tdee);
    document.getElementById('recommended-calories').textContent = Math.round(recommendedCalories);

    resultsSection.classList.remove('hidden');
}

async function logWeight() {
    const date = document.getElementById('weigh-date').value;
    const weightLbs = parseFloat(document.getElementById('weigh-weight').value);
    const weightKg = weightLbs * 0.453592; // Convert to kg for storage

    try {
        const response = await fetch('/api/user/weight', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ date, weight: weightKg })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message);
        }

        alert('Weight logged successfully');
        fetchUserProfile();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function updateWeightChart(weightHistory) {
    const dates = weightHistory.map(entry => entry.date);
    const weights = weightHistory.map(entry => entry.weight * 2.20462); // Convert kg to lbs

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(weightChart, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Weight (lbs)',
                data: weights,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

// ... (previous code)

let token = localStorage.getItem('token');

async function register() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const age = parseInt(document.getElementById('age').value);
    const gender = document.getElementById('gender').value;
    const height = parseInt(document.getElementById('height').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const activityLevel = parseFloat(document.getElementById('activity').value);
    const goal = document.getElementById('goal').value;

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, age, gender, height, weight, activityLevel, goal })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message);
        }

        alert('Registration successful. Please log in.');
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message);
        }

        const data = await response.json();
        token = data.token;
        localStorage.setItem('token', token);
        fetchUserProfile();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function fetchUserProfile() {
    try {
        const response = await fetch('/api/user/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user profile');
        }

        const user = await response.json();
        updateUIWithUserData(user);
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function updateUIWithUserData(user) {
    const heightInches = Math.round(user.height / 2.54);
    const heightFeet = Math.floor(heightInches / 12);
    const remainingInches = heightInches % 12;
    
    document.getElementById('age').value = user.age;
    document.getElementById('gender').value = user.gender;
    document.getElementById('height-feet').value = heightFeet;
    document.getElementById('height-inches').value = remainingInches;
    document.getElementById('weight').value = Math.round(user.weight * 2.20462); // Convert kg to lbs
    document.getElementById('activity').value = user.activityLevel;
    document.getElementById('goal').value = user.goal;

    calculateMetrics();
    updateWeightChart(user.weightHistory);
}

document.getElementById('weight-log-form').addEventListener('submit', logWeight);

function logWeight(event) {
    event.preventDefault();
    
    const date = document.getElementById('weigh-date').value;
    const weight = document.getElementById('weigh-weight').value;

    // Format the entry
    const formattedEntry = `Date: ${date}\nWeight: ${weight} lbs`;

    // Display the formatted entry in the textarea
    const outputText = document.getElementById('output-text');
    outputText.value = formattedEntry;
    
    // Show the formatted output section
    document.getElementById('formatted-output').style.display = 'block';
}

function copyToClipboard() {
    const outputText = document.getElementById('output-text');
    const textToCopy = outputText.value;

    navigator.clipboard.writeText(textToCopy).then(() => {
        alert('Copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}



  function calculateTDEE() {
    // Get user inputs
    const weightLbs = parseFloat(document.getElementById('weight').value);
    const heightFeet = parseFloat(document.getElementById('height-feet').value);
    const heightInches = parseFloat(document.getElementById('height-inches').value);
    const age = parseInt(document.getElementById('age').value);
    const gender = document.getElementById('gender').value;
    const activityLevel = parseFloat(document.getElementById('activity').value);

    // Convert pounds to kg
    const weightKg = weightLbs * 0.453592;

    // Convert feet and inches to cm
    const heightCm = ((heightFeet * 12) + heightInches) * 2.54;

    // Calculate BMR (Basal Metabolic Rate) using the Mifflin-St Jeor Equation
    let bmr;
    if (gender === 'male') {
        bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    } else {
        bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    }

    // Calculate TDEE
    const tdee = bmr * activityLevel;

    return Math.round(tdee);
}

function showTab(tabName) {
    const tabs = document.getElementsByClassName('tab-content');
    const buttons = document.getElementsByClassName('tab-button');
    
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove('active');
        buttons[i].classList.remove('active');
    }
    
    document.getElementById(tabName + '-form').classList.add('active');
    event.currentTarget.classList.add('active');
}
})

// ... (rest of the previous code)