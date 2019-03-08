// inslude the SPI library:
#include <SPI.h>


// set pin 10 as the slave select for the digital pot:
const int ADCPin = 10;
const int SPI_miso = 12;
const int SPI_clk = 13;
const int SPI_mosi = 11;

const int relay_0 = 2;
const int relay_1 = 3;
const int relay_2 = 4;
const int relay_3 = 5;

byte read_byte = 0x0;

int adc_read = 0;
int sample_counter=0;

bool send_data = true;

long int read_period_us = 100000;
long int sample_delta=0;
long int time_delta=0;

byte output_data[24];

const SPISettings PGA_SPI_settings(1000000, MSBFIRST, SPI_MODE1); 
const SPISettings ADC_SPI_settings(1000000, MSBFIRST, SPI_MODE0); 

void setup() {
  pinMode(ADCPin, OUTPUT);
  pinMode(relay_0, OUTPUT);
  pinMode(relay_1, OUTPUT);
  pinMode(relay_2, OUTPUT);
  pinMode(relay_3, OUTPUT);

  pinMode(6, OUTPUT);
  digitalWrite(6, HIGH);
  
  delay(2500);
  SPI.begin();
  Serial.begin(115200);
}

void change_res(int val) {
  if (val == 0) {
    /*Relay 1 Resistance value = 0*/
    digitalWrite(relay_0, HIGH);
    digitalWrite(relay_1, LOW);
    digitalWrite(relay_2, HIGH);
    digitalWrite(relay_3, LOW);
  } else if (val == 1) {
    /*Relay 1 Resistance value = 1*/
    digitalWrite(relay_0, LOW);
    digitalWrite(relay_1, HIGH);
    digitalWrite(relay_2, LOW);
    digitalWrite(relay_3, HIGH);
  } else if (val == 2) {
    /*Relay 2 Resistance value = 1k*/  
    digitalWrite(relay_0, LOW);
    digitalWrite(relay_1, HIGH);
    digitalWrite(relay_2, HIGH);
    digitalWrite(relay_3, LOW);
  }
}


void loop() {

  //Read ADC data.
  SPI.end();
  int i=0;
  pinMode(SPI_mosi, OUTPUT);
  pinMode(SPI_miso, INPUT);
  pinMode(SPI_clk, OUTPUT);

  digitalWrite(SPI_mosi, HIGH);

  long int start_time=micros();
  long int last_sample_time=0;

  change_res(0);
  
  while (true) {
    /*read data from the ADC*/
    adc_read = 0;
    if (send_data) {
      while (sample_delta < read_period_us) {
        time_delta = micros() - start_time;
        sample_delta = time_delta - last_sample_time;
      }
      sample_delta=0;
      last_sample_time = time_delta;
      sample_counter = time_delta / read_period_us;
      digitalWrite(ADCPin, HIGH);
      delayMicroseconds(10);
      digitalWrite(ADCPin, LOW);
  
      /*Convert read data into an integer*/
      for (i=15;i>=0;i--) {
        digitalWrite(SPI_clk, HIGH);
        delayMicroseconds(1);
        digitalWrite(SPI_clk, LOW);
        delayMicroseconds(1);
        adc_read |= digitalRead(SPI_miso) << i;
      }
      
      Serial.print(sample_counter);
      Serial.print(",");
      Serial.println(adc_read);
    } else {
        start_time=micros();
        last_sample_time=0;
    }

  /*Check if any data has been sent to the arduino*/
    if (Serial.available()) {
      read_byte = Serial.read();
      //Serial.println(read_byte);
      if        (read_byte == 0x00) { //set resistor to 0
        change_res(0);
      } else if (read_byte == 0x01) { //set resistor to 1
        change_res(1);
      } else if (read_byte == 0x02) { //set resistor to 2
        change_res(2);
      } else if (read_byte == 0x03) { //enable sampling
        send_data = true;
      } else if (read_byte == 0x04) { //disable sampling
        send_data = false;
      }
    }
  }
  
}
