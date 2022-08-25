if (typeof Manchaware == "undefined") {
  var Manchaware = {};
}

OUTPUT_TYPE = {
  PLAIN: 'plain',
  ARRAY: 'array',
  METHOD: 'method'
};

Manchaware = $.extend({}, Manchaware || {});
Manchaware.Detect = {
  supportFile: function () {
    return window.File && window.FileReader && window.FileList && window.Blob;
  },
};
Manchaware.ColorUtil = {
  componentToHex: function(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  },

  rgbToHex: function(r, g, b) {
    return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
  }
};
Manchaware.CodeGenerator = {
  code: '',
  Base: {
    TAB: '  ',
    doEnableXYOffset: false,
    doUseColorUtil: false,
    doUseColorVariable: false,
    doUse32BitColor: false,

    hexTo32UInt: function(hex) {
      return hex.replace('#', '0x');
    },

    getColorCode: function(index) {
      var code = '';
      if (this.doUseColorUtil) {
        code +=
        'ColorUtil::Color(' +
        Manchaware.SpritePainter.colorsRGB[index].r +
        ', ' +
        Manchaware.SpritePainter.colorsRGB[index].g +
        ', ' +
        Manchaware.SpritePainter.colorsRGB[index].b +
        ')';
      } else {
        code += this.hexTo32UInt(Manchaware.SpritePainter.colors[index]);
      }

      return code;
    },

    getOptions: function() {
      this.outputType = $('select[name="outputType"]').get(0).value;

      if (this.outputType == OUTPUT_TYPE.METHOD) {
        this.doEnableXYOffset = $('input[name="doEnableXYOffset"]').get(0).checked;
      }

      this.doUseColorUtil = $('input[name="doUseColorUtil"]').get(0).checked;
      this.doUseColorVariable = $('input[name="doUseColorVariable"]').get(0).checked;
      this.doUse32BitColor = $('input[name="doUse32BitColor"]').get(0).checked;
    }
  },
};
Manchaware.CodeGenerator.Trellis = $.extend({
  generate: function () {
    this.getOptions();

    var code = '';

    if (this.outputType == OUTPUT_TYPE.ARRAY) {
      // uint32_t sprite[4][4] = {
      //   { 0x230FA6, 0x230FA6, 0x8BADD9, 0x8BADD9 },
      //   { 0x230FA6, 0x4449A6, 0x4449A6, 0x230FA6 },
      //   { 0x230FA6, 0x4449A6, 0x4449A6, 0x230FA6 },
      //   { 0xF2D750, 0xF25F29, 0x230FA6, 0x230FA6 }
      // };
      var width = $('input[name="matrixWidth"]').val();
      var height = $('input[name="matrixHeight"]').val();

      code += 'uint32_t ' + $('input[name="arrayName"]').val() + '[' + width + '][' + height + '] = {\n';

      var self = this;
      $(".sprite-row").each(function (y, row) {
        code += self.TAB + '{ ';

        $(row)
          .find(".pixel")
          .each(function (x, pixel) {
            pixel = $(pixel);
            if (pixel.hasClass("painted")) {
              var color = pixel.data("color");
              code += self.hexTo32UInt(color.hex);
            } else {
              code += '0x000000';
            }

            if (x < width - 1) {
              code += ', ';
            }
          });

          code += '}';
          if (y < height - 1) {
            code += ', \n';
          } else {
            code += '\n';
          }
      });

      code += '};\n';
    } else {
      if (this.outputType == OUTPUT_TYPE.METHOD) {
        code += 'void ' + $('input[name="methodName"]').val();

        if (this.doEnableXYOffset) {
          code += '(int x, int y) {\n';
        } else {
          code += '() {\n';
        }
      }

      if (this.doUseColorVariable) {
        for (var i = 0; i < Manchaware.SpritePainter.colors.length; i++) {
          if (this.outputType == OUTPUT_TYPE.METHOD) {
            code += this.TAB;
          }

          code += this.doUse32BitColor ? 'uint32_t' : 'uint16_t'
          code += ' color' + i + ' = ' + this.getColorCode(i) + ';\n';
        }
        code += '\n';
      }

      var self = this;
      $(".sprite-row").each(function (y, row) {
        $(row)
          .find(".pixel")
          .each(function (x, pixel) {
            pixel = $(pixel);
            if (pixel.hasClass("painted")) {
              var color = pixel.data("color");

              if (self.outputType == OUTPUT_TYPE.METHOD) {
                code += self.TAB;
              }
              code += "trellis.";

              code += "setPixelColor(";

              if (self.doEnableXYOffset) {
                code += "x + " + x + ", y + " + y + ", ";
              } else {
                code += x + ", " + y + ", ";
              }

              var colorIndex = Manchaware.SpritePainter.colors.indexOf(color.hex);
              if (self.doUseColorVariable) {
                code += "color" + colorIndex;
              } else {
                code += self.getColorCode(colorIndex);
              }

              code += ");\n";
            }
          });
      });

      if (this.outputType == OUTPUT_TYPE.METHOD) {
        code += '}\n';
      }
    }

    return code;
  },
}, Manchaware.CodeGenerator.Base);

Manchaware.CodeGenerator.RGBMatrix = $.extend({
  generate: function () {
    this.getOptions();
  },
}, Manchaware.CodeGenerator.Base);

Manchaware.Matrix = {
  rotateCW: function(matrix) {
    var n = matrix.length;

    // Transpose of matrix
    for (i = 0; i < n; i++) {
        for (j = i+1; j < n; j++) {
            var temp = matrix[i][j];
            matrix[i][j] = matrix[j][i];
            matrix[j][i] = temp;
        }
    }

    // Reverse individual rows
    for (i = 0; i < n; i++) {
        var low = 0, high = n-1;
        while (low < high) {
            var temp = matrix[i][low];
            matrix[i][low] = matrix[i][high];
            matrix[i][high] = temp;
            low++;
            high--;
        }
    }

    return matrix;
  }
};

Manchaware.SpritePainter = {
  generatorKlass: null, // This needs to be set to an appropriate code generator class

  width: 0,
  height: 0,
  rotation: 0,
  brushColor: {
    hex: "#ffffff",
    rgb: { r: 255, g: 255, b: 255 },
  },

  init: function() {
    this.updateGenerator();
    this.updateOutputType();

    this.generateArtboard(8, 8);
  },

  setColorPickerContext: function (swatch, input) {
    this.swatchContext = swatch;
    this.inputContext = input;
  },

  setCurrentColor: function (hex, hsv, rgb) {
    this.brushColor.rgb = rgb;
    this.brushColor.hsv = hsv;
    this.brushColor.hex = hex;

    if (this.doUpdatePixels) {
      $('.pixel[data-color="' + this.inputContext.val() + '"]').each(function (
        index,
        pixel
      ) {
        pixel = $(pixel);

        pixel.css("backgroundColor", hex);
        pixel.attr("data-color", hex);
      });
    }

    this.swatchContext.css("backgroundColor", hex);
    this.inputContext.val(hex);
  },

  generateArtboard: function (width, height) {
    //must generate columns first to increment width
    for (var i = 0; i < width; i++) {
      this.insertColumn();
    }

    for (var i = 0; i < height; i++) {
      this.insertRow();
    }

    this.recalculateContainerDimensions();
  },

  bindEvents: function (pixel) {
    pixel.unbind("mousedown, mouseup, mousemove");

    var self = this;

    pixel.bind("mousedown", function (event) {
      if (event.which == 1) {
        self.paintStartElement = $(event.target);
        self.isPainted = $(event.target).hasClass("painted");
        self.canPaint = true;

        self.hideColorModal();
      }
    });

    pixel.bind("mouseup", function (event) {
      if (event.which == 1) {
        var pixel = $(event.target);
        if (self.paintStartElement.is($(event.target))) {
          pixel.toggleClass("painted");
        }

        if (pixel.hasClass("painted")) {
          self.paintPixel(pixel);
        } else {
          pixel.css("background-color", "transparent");
        }

        self.generateCode();
      }

      self.canPaint = false;
    });

    pixel.bind("mousemove", function (event) {
      if (self.canPaint) {
        var pixel = $(event.target);

        if (!self.isPainted) {
          self.paintPixel(pixel);
        } else {
          pixel.removeClass("painted");
          pixel.css("background-color", "transparent");
        }
      }
    });
  },

  paintPixel: function (pixel) {
    pixel.addClass("painted");
    pixel.css("background-color", this.brushColor.hex);
    pixel.data("color", jQuery.extend(true, {}, this.brushColor));
    pixel.attr("data-color", this.brushColor.hex);
  },

  calculateNewSize: function () {
    var newWidth = $('input[name="matrixWidth"]').val();
    var newHeight = $('input[name="matrixHeight"]').val();

    var difference = 0;

    if (newWidth > this.width) {
      difference = newWidth - this.width;
      for (var i = 0; i < difference; i++) {
        this.insertColumn();
      }
    } else if (newWidth < this.width) {
      difference = this.width - newWidth;
      for (var i = 0; i < difference; i++) {
        this.removeColumn();
      }
    }

    if (newHeight > this.height) {
      difference = newHeight - this.height;
      for (var i = 0; i < difference; i++) {
        this.insertRow();
      }
    } else if (newHeight < this.height) {
      difference = this.height - newHeight;
      for (var i = 0; i < difference; i++) {
        this.removeRow();
      }
    }
  },

  rotate: function (doRotateCCW) {
    if (doRotateCCW) {
      this.rotation -= 90;
      if (this.rotation <= -360) {
        this.rotation = 0;
      }
    } else {
      this.rotation += 90;
      if (this.rotation >= 360) {
        this.rotation = 0;
      }
    }

    $("#sprite_canvas_container").css({
      webkitTransform: "rotate(" + this.rotation + "deg)",
      mozTransform: "rotate(" + this.rotation + "deg)",
      Transform: "rotate(" + this.rotation + "deg)",
    });
  },

  loadImage: function(e) {
    var ctx = $('#image_canvas').get(0).getContext('2d');
    var img = new Image;
    img.src = URL.createObjectURL(e.target.files[0]);

    img.onload = function() {
      ctx.drawImage(img, 0, 0, this.width, this.height, 0, 0, Manchaware.SpritePainter.width, Manchaware.SpritePainter.height);

      for (var row = 0; row < Manchaware.SpritePainter.height; row++) {
        for (var col = 0; col < Manchaware.SpritePainter.width; col++) {
          var imageData = ctx.getImageData(col, row, 1, 1).data;
          var rgb = Manchaware.SpritePainter.brushColor.rgb = {
            r: imageData[0],
            g: imageData[1],
            b: imageData[2]
          };

          var hex = Manchaware.ColorUtil.rgbToHex(rgb.r, rgb.g, rgb.b);
          Manchaware.SpritePainter.brushColor.hex = hex;
          Manchaware.SpritePainter.paintPixel($($($('.sprite-row').get(row)).find('.pixel').get(col)));
        }
      }

      Manchaware.SpritePainter.generateColorPalette();
      Manchaware.SpritePainter.generateCode();
    }
  },

  insertRow: function (doPrepend) {
    var row = $('<div class="sprite-row"></div>');
    for (var i = 0; i < this.width; i++) {
      var pixel = $('<div class="pixel"></div>');
      this.bindEvents(pixel);
      row.append(pixel);
    }

    if (doPrepend) {
      $("#sprite_canvas_container").prepend(row);
    } else {
      $("#sprite_canvas_container").append(row);
    }

    this.height++;
    this.recalculateContainerDimensions();
  },

  removeRow: function (doRemoveFirst) {
    var row;
    if (doRemoveFirst) {
      row = $(".sprite-row").first();
    } else {
      row = $(".sprite-row").last();
    }
    row.detach();

    this.height--;
    this.recalculateContainerDimensions();
  },

  insertColumn: function (doPrepend) {
    for (var i = 0; i < this.height; i++) {
      var row = $(".sprite-row").eq(i);
      var pixel = $('<div class="pixel"></div>');
      this.bindEvents(pixel);

      if (doPrepend) {
        row.prepend(pixel);
      } else {
        row.append(pixel);
      }
    }

    this.width++;
    this.recalculateContainerDimensions();
  },

  removeColumn: function (doRemoveFirst) {
    for (var i = 0; i < this.height; i++) {
      var pixels = $(".sprite-row").eq(i).find(".pixel");

      if (doRemoveFirst) {
        pixels.first().detach();
      } else {
        pixels.last().detach();
      }
    }

    this.width--;
    this.recalculateContainerDimensions();
  },

  recalculateContainerDimensions: function () {
    $("#sprite_canvas_container").css({
      width: this.width * 20,
      height: this.height * 20,
    });

    $('input[name="matrixWidth"]').val(this.width);
    $('input[name="matrixHeight"]').val(this.height);
    this.generateCode();
  },

  updateGenerator: function() {
    var generatorType = $('select[name="generatorType"]').get(0).value;
    switch (generatorType) {
      case 'trellis':
        this.generatorKlass = Manchaware.CodeGenerator.Trellis;
        break;
      case 'rgb_matrix':
        this.generatorKlass = Manchaware.CodeGenerator.RGBMatrix;
        break;
    }

    this.generateCode();
  },

  updateOutputType: function() {
    this.generatorKlass.outputType = $('select[name="outputType"]').get(0).value;
    if (this.generatorKlass.outputType == OUTPUT_TYPE.METHOD) {
      $('#method_options').show();
    } else {
      $('#method_options').hide();
    }

    if (this.generatorKlass.outputType == OUTPUT_TYPE.ARRAY) {
      $('#color_options').hide();
      $('#array_options').show();
    } else {
      $('#color_options').show();
      $('#array_options').hide();
    }


    this.generateCode();
  },

  generateColorPalette: function() {
    $(".colors-used-label").show();
    $(".colors-used-container").html("");

    this.colors = new Array();
    this.colorsRGB = new Array();

    $(".pixel.painted").each(function (index, pixel) {
      if ($(pixel).hasClass("painted")) {
        var color = $(pixel).data("color");
        if (Manchaware.SpritePainter.colors.indexOf(color.hex) == -1) {
          Manchaware.SpritePainter.colors.push(color.hex);
          Manchaware.SpritePainter.colorsRGB.push(color.rgb);

          var helper = $(".helpers .color-picker-container-helper").clone(true);
          helper.removeClass("color-picker-container-helper");
          helper.find(".new-swatch").css("backgroundColor", color.hex);
          helper.find('input[name="brushColor"]').val(color.hex);
          $(".colors-used-container").append(helper);
        }
      }
    });
    if (Manchaware.SpritePainter.colors.length > 0) {
      $(".colors-used-label").show();
    }
  },
  generateCode: function () {
    this.generateColorPalette();
    $("#code").val(this.generatorKlass.generate());

    // if (doGenerateMethod) {
    //   code += "void " + $('input[name="methodName"]').val();

    //   if (doEnableXYOffset) {
    //     code += "(int x, int y) {\n";
    //   } else {
    //     code += "() {\n";
    //   }
    // }

    // if (doUseColorVariable) {
    //   for (var i = 0; i < colors.length; i++) {
    //     if (doGenerateMethod) {
    //       code += TAB;
    //     }

    //     code += doUse32BitColor ? "uint32_t" : "uint16_t"

    //     code += " color" + i + " = ";

    //     if (doUse32BitColor) {
    //       code += colors[i].replace('#', '0x') + ';\n';
    //     } else {
    //       if (doUseMatrixInstance) {
    //         code += $('input[name="matrixInstanceName"]').val() + ".";
    //       }

    //       code +=
    //       "Color888(" +
    //       colorsRGB[i].r +
    //       ", " +
    //       colorsRGB[i].g +
    //       ", " +
    //       colorsRGB[i].b +
    //       ", true); //" +
    //       colors[i] +
    //       "\n";
    //     }
    //   }

    //   if (colors.length > 0) {
    //     $(".colors-used-label").show();
    //   }
    //   code += "\n";
    // }

    //calculate painted pixels
    // $(".sprite-row").each(function (y, row) {
    //   $(row)
    //     .find(".pixel")
    //     .each(function (x, pixel) {
    //       pixel = $(pixel);
    //       if (pixel.hasClass("painted")) {
    //         var color = pixel.data("color");

    //         code += "  ";

    //         if (doUseMatrixInstance) {
    //           code += $('input[name="matrixInstanceName"]').val() + ".";
    //         }

    //         code += "drawPixel(";

    //         if (doEnableXYOffset) {
    //           code += "x + " + x + ", y + " + y + ", ";
    //         } else {
    //           code += x + ", " + y + ", ";
    //         }

    //         if (doUseColorVariable) {
    //           code += "color" + colors.indexOf(color.hex);
    //         } else {
    //           if (doUseMatrixInstance) {
    //             code += $('input[name="matrixInstanceName"]').val() + ".";
    //           }

    //           code +=
    //             "Color888(" +
    //             color.rgb.r +
    //             ", " +
    //             color.rgb.g +
    //             ", " +
    //             color.rgb.b +
    //             ", true)";
    //         }

    //         code += ");\n";
    //       }
    //     });
    // });

    // if (doGenerateMethod) {
    //   code += "}\n";
    // }
  },

  toggleSubGroupOptions: function (activator) {
    if (activator.checked) {
      $(activator).closest(".input-group").find(".sub-group").show();
    } else {
      $(activator).closest(".input-group").find(".sub-group").hide();
    }

    this.generateCode();
  },

  toggleCodeOptions: function (activator) {
    $(activator).toggleClass("selected");
    if ($(activator).hasClass("selected")) {
      $(activator).closest(".expandable-container").addClass("options-visible");
    } else {
      $(activator)
        .closest(".expandable-container")
        .removeClass("options-visible");
    }
  },

  showColorModal: function (activator) {
    $("#color_picker_modal")
      .css({
        top: $(activator).offset().top - 5,
      })
      .show();

    this.canPaint = false;
  },

  hideColorModal: function () {
    $("#color_picker_modal").hide();
  },

  updateColorPicker: function (activator, doUpdatePixels) {
    this.swatchContext = $(activator);
    this.inputContext = $(activator).next();
    this.doUpdatePixels = doUpdatePixels;

    this.showColorModal(activator);
  },

  clearMatrix: function () {
    $(".pixel")
      .removeClass("painted")
      .css("backgroundColor", "transparent")
      .attr("data-color", null);

    $('input[name="imageFile"]').val("");

    this.generateCode();
  },

  map: function (x, in_min, in_max, out_min, out_max) {
    return ((x - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
  },
};

$(function () {
  Manchaware.SpritePainter.init();

  Manchaware.SpritePainter.colorPicker = ColorPicker(
    $("#color-picker").get(0),
    function (hex, hsv, rgb) {
      Manchaware.SpritePainter.setCurrentColor(hex, hsv, rgb);
    }
  );

  $(document).bind("mouseup", function (event) {
    if (event.which == 1) {
      Manchaware.SpritePainter.canPaint = false;
    }
  });

  if (!Manchaware.Detect.supportFile()) {
    $(".input-export-container").detach();
  }

  $(".resizable").each(function (index, element) {
    var activator = $(element).find("h2");
    var isDragging = false;

    var offsetY = 0;
    $(activator).bind("mousedown", function (event) {
      if (event.which == 1) {
        isDragging = true;
        offsetY = event.offsetY;
        $(activator).addClass("resize-vert");
      }
    });
    $(document).bind("mouseup", function (event) {
      isDragging = false;
      $(activator).removeClass("resize-vert");
    });

    $(document).bind("mousemove", function (event) {
      if (isDragging) {
        $(element).css("height", $(window).height() - event.pageY + offsetY);
      }
    });
  });
});
