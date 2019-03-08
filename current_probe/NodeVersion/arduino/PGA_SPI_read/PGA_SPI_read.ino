// inslude the SPI library:
#include <SPI.h>


// set pin 10 as the slave select for the digital pot:
const int PGAPin = 6;
const int ADCPin = A1;
const int ADC_pdwn = A2;
const int SPI_miso = 12;
const int SPI_clk = 13;

byte output_data[24];

const SPISettings PGA_SPI_settings(1000000, MSBFIRST, SPI_MODE1); 
const SPISettings ADC_SPI_settings(1000000, MSBFIRST, SPI_MODE0); 

void setup() {
  // set the slaveSelectPin as an output:
  pinMode(PGAPin, OUTPUT);
  pinMode(ADCPin, OUTPUT);
  pinMode(ADC_pdwn, OUTPUT);
  digitalWrite(PGAPin, HIGH);
  digitalWrite(ADCPin, HIGH);
  digitalWrite(ADC_pdwn, LOW);  
  delay(2500);
  digitalWrite(ADC_pdwn, HIGH);
  // initialize SPI:
  SPI.begin();
  //ADC IS SPI MODE1
  //SPI.beginTransaction(SPISettings(1000000, MSBFIRST, SPI_MODE1));
  //SPI.beginTransaction(SPISettings(500000, MSBFIRST, SPI_MODE0));
  Serial.begin(9600);
}

byte read_adc(byte address) {
  SPI.beginTransaction(ADC_SPI_settings);
  digitalWrite(ADCPin, LOW);
  SPI.transfer(address);
  byte result = SPI.transfer(0x00);
  digitalWrite(ADCPin, HIGH);
  SPI.endTransaction();
  return result;
}
void write_adc(byte address, byte data) {
  SPI.beginTransaction(ADC_SPI_settings);
  digitalWrite(ADCPin, LOW);
  SPI.transfer(address);
  SPI.transfer(data);
  digitalWrite(ADCPin, HIGH);
  SPI.endTransaction();
  return;
}
byte read_pga(byte address) {
  //first must disable the ADC
  write_adc(0x82,0x2);
  SPI.beginTransaction(PGA_SPI_settings);
  digitalWrite(PGAPin, LOW);
  SPI.transfer(address);
  byte result = SPI.transfer(0x00);
  digitalWrite(PGAPin, HIGH);
  SPI.endTransaction();
  //then re-enable the ADC
  write_adc(0x82,0x0);
  return result;
}
void write_pga(byte address, byte data) {
  //first must disable the ADC
  write_adc(0x82,0x2);
  SPI.beginTransaction(PGA_SPI_settings);
  digitalWrite(PGAPin, LOW);
  SPI.transfer(address);
  SPI.transfer(data);
  digitalWrite(PGAPin, HIGH);
  SPI.endTransaction();
  //then re-enable the ADC
  write_adc(0x82,0x0);
  return;
}


void loop() {
  write_adc(0x87,0x2);
  Serial.write("ADC read response: ");
  Serial.println(read_adc(0x7),BIN);
  Serial.write("PGA read response: ");
  Serial.println(read_pga(0x83),BIN);

  //Set up PGA gain to 128
  write_pga(0x40,0x00);
  Serial.write("Is there a PGA error?: ");
  Serial.println(read_pga(0x84),BIN);
  write_pga(0x44,0xFF);
  //Set up PGA gain to 128
  //write_pga(0x40,0x50);
  // note that the default PGA switch configuration is correct for this
  
  

  //Set up the ADC
  // Set input channel to 1
  write_adc(0x88,0x00);
  //Set internal PGA gain (to 1)
  write_adc(0x97, 0x00);
  //Set internal mux to AIn1
  write_adc(0x87, 0x00);
  //Set data rate to 1ksps
  write_adc(0x85, 0x11);
  //Start the continuous conversion
  write_adc(0x84, 0x02);
  //Do an offset calibration
  write_adc(0x84, 0x02);

  //Read ADC data.
  SPI.end();
  int i=0;
  pinMode(SPI_miso, INPUT);
  pinMode(SPI_clk, OUTPUT);
  while (true) {
    delay(1000);
    if (!digitalRead(SPI_miso)) {
      //data is ready
      for (i=0;i<24;i++) {
        digitalWrite(SPI_clk, HIGH);
        delayMicroseconds(1);
        if (digitalRead(SPI_miso)) {
          output_data[i]=0x1;
        } else {
          output_data[i]=0x0;
        }
        digitalWrite(SPI_clk, LOW);
        delayMicroseconds(1);
      }
    }
    for(int i = 0; i < 24; i++)
    {
      Serial.print(output_data[i]);
    }
    Serial.println(" <- ADC Data");
  }
  
  
  
  
  delay(1000);
  
 // byte result = read_adc(0x83,0x00)
  

//  delay(1000); 
//  //digitalWrite(PGAPin, LOW);
//  digitalWrite(ADCPin, LOW);
//  delay(0.01);
//  //SPI.transfer(0xBE); //Send register location
//  //SPI.transfer(0x9E);  //Send value to record into register
//  //byte address = 0x83; //USED FOR ADC TEST
//  byte address = 0x97;
//  //SPI.transfer(address);
//  SPI.transfer(0x82);
//  SPI.transfer(0x00);
//  delay(0.1);
//  digitalWrite(ADCPin, HIGH);
//  delay(0.1);
//  digitalWrite(ADCPin, LOW);
//  delay(0.1);
//  SPI.transfer(0x97);
//  SPI.transfer(0xA5);
//  delay(0.1);
//  digitalWrite(ADCPin, HIGH);
//  delay(0.1);
//  digitalWrite(ADCPin, LOW);
//  delay(0.1);
//  SPI.transfer(0x17);
//  byte result = SPI.transfer(0x00);
//  Serial.write("SPI response: ");
//  Serial.println(result,BIN);
//  digitalWrite(PGAPin, HIGH);
//  digitalWrite(ADCPin, HIGH);
  
  // go through the six channels of the digital pot:
 // delay(100);
  //  send in the address and value via SPI:
//  SPI.transfer(address);
//  SPI.transfer(value);
//  delay(100);
  // take the SS pin high to de-select the chip:
}
