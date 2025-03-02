# Zehnder Comfoair Mechanical Ventilation

Adds support for Zehnder Comfoair Mechanical Ventilation units with Heat Recovery

## Installation

1. Ensure Node.js (v12+) is installed.
2. Install Homey CLI globally:
   ```
   npm install -g homey
   ```
3. Clone the repository:
   ```
   git clone https://github.com/Codeneos/homey-zehnder-comfoair.git
   ```
4. Navigate to the project directory and install dependencies:
   ```
   cd homey-zehnder-comfoair
   npm install
   ```

## Running the App

1. Build the app:
   ```
   npm run build
   ```
2. Deploy the app on your Homey device using Homey CLI:
   ```
   npm run deploy
   ```
   Alternatively, for development, you may use:
   ```
   npm start
   ```  

The app will launch, connecting to the configured ventilation unit.

## Current Capabilities

- fan_mode: control ventilation fan speed.
- measure_power: monitor current power consumption.
- meter_power: track total power consumption since start (KWH).
- measure_hepa_filter: track HEPA filter life.
- measure_analog_input_1: read sensor analog input 1.
- measure_analog_input_2: read sensor analog input 2.
- measure_analog_input_3: read sensor analog input 3.
- measure_analog_input_4: read sensor analog input 4.
- measure_outdoor_temperature: monitor outdoor temperature.
- measure_outdoor_humidity: monitor outdoor humidity.
- measure_indoor_temperature: monitor indoor temperature.
- measure_indoor_humidity: monitor indoor humidity.
- measure_exhaust_fan_speed: monitor exhaust fan speed.
- measure_extract_fan_speed: monitor supply fan speed.