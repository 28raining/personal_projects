/*
  Button

  Turns on and off a light emitting diode(LED) connected to digital pin 13,
  when pressing a pushbutton attached to pin 2.

  The circuit:
  - LED attached from pin 13 to ground
  - pushbutton attached to pin 2 from +5V
  - 10K resistor attached to pin 2 from ground

  - Note: on most Arduinos there is already an LED on the board
    attached to pin 13.

  created 2005
  by DojoDave <http://www.0j0.org>
  modified 30 Aug 2011
  by Tom Igoe

  This example code is in the public domain.

  http://www.arduino.cc/en/Tutorial/Button
*/

// constants won't change. They're used here to set pin numbers:
const int buttonPin = 2;     // the number of the pushbutton pin
const int ledPin =  13;      // the number of the LED pin

const int relay_0 = 2;
const int relay_1 = 3;
const int relay_2 = 4;
const int relay_3 = 5;

// variables will change:
int buttonState = 0;         // variable for reading the pushbutton status

void setup() {

  pinMode(relay_0, OUTPUT);
  pinMode(relay_1, OUTPUT);
  pinMode(relay_2, OUTPUT);
  pinMode(relay_3, OUTPUT);
  pinMode(LED_BUILTIN, OUTPUT);
  
  // initialize the LED pin as an output:
  //pinMode(ledPin, OUTPUT);
  // initialize the pushbutton pin as an input:
  //pinMode(buttonPin, INPUT);
}

void loop() {
  while (true) {
    //do nothing
  }
  digitalWrite(relay_0, HIGH);
  digitalWrite(relay_1, HIGH);
  delay(1000);                //wait for a second
  digitalWrite(relay_0, LOW);
  digitalWrite(relay_1, HIGH);
  delay(10);
  digitalWrite(relay_0, LOW);
  digitalWrite(relay_1, LOW);
  delay(1000);
  digitalWrite(relay_2, HIGH);
  digitalWrite(relay_3, LOW);
  digitalWrite(LED_BUILTIN, LOW);   // turn the LED on (HIGH is the voltage level)
  delay(10);
  digitalWrite(relay_2, LOW);
  digitalWrite(relay_3, LOW);
  delay(1000);
  digitalWrite(relay_2, LOW);
  digitalWrite(relay_3, HIGH);
  digitalWrite(LED_BUILTIN, HIGH);   // turn the LED on (HIGH is the voltage level)
  delay(10);
  digitalWrite(relay_2, HIGH);
  digitalWrite(relay_3, HIGH);
  delay(1000);
  digitalWrite(relay_0, HIGH);
  digitalWrite(relay_1, LOW);
  delay(10);
  
  
//  // read the state of the pushbutton value:
//  buttonState = digitalRead(buttonPin);
//
//  // check if the pushbutton is pressed. If it is, the buttonState is HIGH:
//  if (buttonState == HIGH) {
//    // turn LED on:
//    digitalWrite(ledPin, HIGH);
//  } else {
//    // turn LED off:
//    digitalWrite(ledPin, LOW);
//  }
}
