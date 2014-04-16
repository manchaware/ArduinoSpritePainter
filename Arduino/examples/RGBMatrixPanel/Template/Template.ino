#include <Adafruit_GFX.h>
#include <RGBmatrixPanel.h>

#define CLK 11
#define LAT 10
#define OE  9
#define A   A0
#define B   A1
#define C   A2

RGBmatrixPanel matrix(A, B, C, CLK, LAT, OE, true);

void setup() {
  matrix.begin();
}

void loop() {
  matrix.fillScreen(0); //clears screen, prepares for a redraw
  
  drawSprite(0, 0);
  
  matrix.swapBuffers(false); //applys draw commands to display
  delay(180); 
}

//You can use this method or create new ones to draw your sprites
void drawSprite(int x, int y) {
  //paste code from sprite painter here
}


