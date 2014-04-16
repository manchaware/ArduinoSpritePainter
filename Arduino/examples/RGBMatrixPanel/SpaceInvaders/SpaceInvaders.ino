//Required Libraries
#include <Adafruit_GFX.h> // https://github.com/adafruit/Adafruit-GFX-Library
#include <RGBmatrixPanel.h> // https://github.com/adafruit/RGB-matrix-Panel

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

int alienX = 0;
int alienDir = 1;
boolean alienArmUp = false;

void loop() {
  matrix.fillScreen(0);
  
  
  alienX += 1 * alienDir;
  if (alienX > 32 - 10) {
    alienDir = -1;
  }
  if (alienX < 0) {
    alienDir = 1;
  }
  
  alienArmUp = !alienArmUp;
  drawAlien(alienX, 4, alienArmUp);
  drawAlien(alienX - 14, 4, alienArmUp);
  drawAlien(alienX - 28, 4, alienArmUp);
  drawAlien(alienX + 14, 4, alienArmUp);
  drawAlien(alienX + 28, 4, alienArmUp);
  
  
  matrix.swapBuffers(false);
  delay(140);
}

void drawAlien(int x, int y, boolean alternate) {
  matrix.drawPixel(x + 2, y + 0, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 8, y + 0, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 3, y + 1, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 7, y + 1, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 2, y + 2, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 3, y + 2, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 4, y + 2, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 5, y + 2, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 6, y + 2, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 7, y + 2, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 8, y + 2, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 1, y + 3, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 2, y + 3, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 4, y + 3, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 5, y + 3, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 6, y + 3, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 8, y + 3, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 9, y + 3, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 0, y + 4, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 1, y + 4, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 2, y + 4, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 3, y + 4, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 4, y + 4, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 5, y + 4, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 6, y + 4, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 7, y + 4, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 8, y + 4, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 9, y + 4, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 10, y + 4, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 2, y + 5, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 3, y + 5, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 4, y + 5, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 5, y + 5, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 6, y + 5, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 7, y + 5, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 8, y + 5, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 2, y + 6, matrix.Color888(2, 132, 160, true));
  matrix.drawPixel(x + 8, y + 6, matrix.Color888(2, 132, 160, true));
  
  if (alternate) {
    matrix.drawPixel(x + 1, y + 7, matrix.Color888(2, 132, 160, true));
    matrix.drawPixel(x + 9, y + 7, matrix.Color888(2, 132, 160, true));
    matrix.drawPixel(x + 0, y + 2, matrix.Color888(2, 132, 160, true));
    matrix.drawPixel(x + 10, y + 2, matrix.Color888(2, 132, 160, true));
    matrix.drawPixel(x + 0, y + 3, matrix.Color888(2, 132, 160, true));
    matrix.drawPixel(x + 10, y + 3, matrix.Color888(2, 132, 160, true));
  } else {
    matrix.drawPixel(x + 3, y + 7, matrix.Color888(2, 132, 160, true));
    matrix.drawPixel(x + 4, y + 7, matrix.Color888(2, 132, 160, true));
    matrix.drawPixel(x + 6, y + 7, matrix.Color888(2, 132, 160, true));
    matrix.drawPixel(x + 7, y + 7, matrix.Color888(2, 132, 160, true));
    matrix.drawPixel(x + 0, y + 5, matrix.Color888(2, 132, 160, true));
    matrix.drawPixel(x + 10, y + 5, matrix.Color888(2, 132, 160, true));
    matrix.drawPixel(x + 0, y + 6, matrix.Color888(2, 132, 160, true));
    matrix.drawPixel(x + 10, y + 6, matrix.Color888(2, 132, 160, true));
  }
}
