if (typeof Manchaware == "undefined") { var Manchaware = {}; }

Manchaware = $.extend({}, Manchaware || {});

Manchaware.SpritePainter = {
    width : 0,
    height : 0,
    brushColor : {
        hex : '#ffffff',
        rgb : {r:255, g:255, b:255}
    },
    setCurrentColor: function(hex, hsv, rgb) {
        this.brushColor.rgb = rgb;
        this.brushColor.hsv = hsv;
        this.brushColor.hex = hex;

        $('.swatch').css('backgroundColor', hex);
        $('input[name="brushColor"]').val(hex);
    },
    generateArtboard: function(width, height) {
        //must generate columns first to increment width
        for (var i = 0; i < width; i++) {
            this.insertColumn();
        }

        for (var i = 0; i < height; i++) {
            this.insertRow();
        }

        this.recalculateContainerDimensions();
    },

    bindEvents: function(pixel) {
        pixel.unbind('mousedown, mouseup, mousemove');

        var self = this;
        
        pixel.bind('mousedown', function(event){
            if (event.which == 1) {
                self.paintStartElement = $(event.target);
                self.isPainted = $(event.target).hasClass('painted');
                self.canPaint = true;

                self.hideColorModal();
            }
        });

        pixel.bind('mouseup', function(event){
            if (event.which == 1) {
                var pixel = $(event.target);
                if (self.paintStartElement.is($(event.target))) {
                    pixel.toggleClass('painted');    
                }

                if (pixel.hasClass('painted')) {
                    pixel.css('backgroundColor', self.brushColor.hex);
                    pixel.data('color', jQuery.extend(true, {}, self.brushColor));
                } else {
                    pixel.css('background-color', 'transparent');
                }

                self.generateCode();
            }

            self.canPaint = false;
        });
        
        pixel.bind('mousemove', function(event){
            if (self.canPaint) {
                var pixel = $(event.target);

                if (!self.isPainted) {
                    pixel.addClass('painted');
                    pixel.css('background-color', self.brushColor.hex);
                    pixel.data('color', jQuery.extend(true, {}, self.brushColor));
                } else {
                    pixel.removeClass('painted');
                    pixel.css('background-color', 'transparent');
                }
            }
        });
    },

    calculateNewSize: function() {
        var newWidth = $('input[name="matrixWidth"]').val();
        var newHeight = $('input[name="matrixHeight"]').val();

        if (newWidth > this.width) {
            var difference = newWidth - this.width;
            for (var i = 0; i < difference; i++) {
                this.insertColumn();
            }
        }

        if (newHeight > this.height) {
            var difference = newHeight - this.height;
            for (var i = 0; i < difference; i++) {
                this.insertRow();
            }
        }
    },

    insertRow: function(doPrepend) {
        var row = $('<div class="sprite-row"></div>');
        for (var i = 0; i < this.width; i++) {
            var pixel = $('<div class="pixel"></div>');
            this.bindEvents(pixel);
            row.append(pixel);
        }

        if (doPrepend) {
            $('#sprite_canvas_container').prepend(row);
        } else {
            $('#sprite_canvas_container').append(row);
        }

        this.height++;
        this.recalculateContainerDimensions();
    },

    removeRow: function(doRemoveFirst) {
        var row;
        if (doRemoveFirst) {
            row = $('.sprite-row').first();
        } else {
            row = $('.sprite-row').last();
        }
        row.detach();

        this.height--;
        this.recalculateContainerDimensions();
    },

    insertColumn: function(doPrepend) {
        for (var i = 0; i < this.width; i++) {
            var row = $('.sprite-row').eq(i);
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

    removeColumn: function(doRemoveFirst) {
        for (var i = 0; i < this.width; i++) {
            var pixels = $('.sprite-row').eq(i).find('.pixel');
            
            if (doRemoveFirst) {
                pixels.first().detach();
            } else {
                pixels.last().detach();
            }
        }

        this.width--;
        this.recalculateContainerDimensions();
    },

    recalculateContainerDimensions: function() {
        $('#sprite_canvas_container').css({
            width : this.width * 20,
            height : this.height * 20
        });
        
        $('input[name="matrixWidth"]').val(this.width);
        $('input[name="matrixHeight"]').val(this.height);
    },

    generateCode: function() { 
        var doGenerateMethod = $('input[name="doGenerateMethod"]').get(0).checked,
            doEnableXYOffset = $('input[name="doEnableXYOffset"]').get(0).checked,
            doUseMatrixInstance = $('input[name="doUseMatrixInstance"]').get(0).checked,
            doUseColorVariable = $('input[name="doUseColorVariable"]').get(0).checked;

        var code = "";

        if (doGenerateMethod) {
            code += "void " + $('input[name="methodName"]').val();

            if (doEnableXYOffset) {
                code += "(int x, int y) {\n";
            } else {
                code += "() {\n";
            }
        }


        //calculate colors
        $('.colors-used-label').hide();
        $('.colors-used-container').html("");
        if (doUseColorVariable) {
            var colors = new Array();
            var colorsRGB = new Array();

            $('.pixel.painted').each(function(index, pixel){
                if ($(pixel).hasClass('painted')) {
                    var color = $(pixel).data('color');
                    if (colors.indexOf(color.hex) == -1) {
                        colors.push(color.hex);
                        colorsRGB.push(color.rgb);

                        var helper = $('.helpers .color-picker-container-helper').clone(true);
                        helper.removeClass('color-picker-container-helper');
                        helper.find('.new-swatch').css('backgroundColor', color.hex);
                        helper.find('input[name="brushColor"]').val(color.hex);
                        $('.colors-used-container').append(helper);
                    }
                }
            });

            for (var i = 0; i < colors.length; i++) {
                code += "  color" + i + " = ";
                if (doUseMatrixInstance) {
                    code += $('input[name="matrixInstanceName"]').val() + ".";
                }

                code += "Color888(" + colorsRGB[i].r + ", " + colorsRGB[i].g + ", " + colorsRGB[i].b + ", true); //" + colors[i] + "\n";
            }

            if (colors.length > 0) {
                $('.colors-used-label').show();
            }
            code += "\n";
        }


        //calculate painted pixels
        $('.sprite-row').each(function(y, row){
            $(row).find('.pixel.painted').each(function(x, pixel){
                pixel = $(pixel);
                var color = pixel.data('color');
                
                code += "  ";

                if (doUseMatrixInstance) {
                    code += $('input[name="matrixInstanceName"]').val() + ".";
                }

                code += "drawPixel(";

                if (doEnableXYOffset) {
                    code += "x + " + x + ", y + " + y + ", ";
                } else {
                    code += x + ", " + y + ", ";
                }

                if (doUseColorVariable) {
                    code += "color" + colors.indexOf(color.hex);
                } else {
                    if (doUseMatrixInstance) {
                        code += $('input[name="matrixInstanceName"]').val() + ".";
                    }

                    code += "Color888(" + color.rgb.r + ", " + color.rgb.g + ", " + color.rgb.b + ", true)";
                }

                code += ");\n"
                
            });
        });


        if (doGenerateMethod) {
            code += "}\n";
        }

        $('#code').val(code);
    },
    
    toggleSubGroupOptions: function(activator) {
        if (activator.checked) {
            $(activator).closest('.input-group').find('.sub-group').show();
        } else {
            $(activator).closest('.input-group').find('.sub-group').hide();
        }

        this.generateCode();
    },

    toggleCodeOptions: function(activator) {
        $(activator).toggleClass('selected');
        if ($(activator).hasClass('selected')) {
            $(activator).closest('.expandable-container').addClass('options-visible');
        } else {
            $(activator).closest('.expandable-container').removeClass('options-visible');
        }
    },
    showColorModal: function(activator) {
        $('#color_picker_modal').css({
            top : $(activator).offset().top
        }).show();

        this.canPaint = false;
    },
    hideColorModal: function() {
        $('#color_picker_modal').hide();
    }
};

$(function(){
    Manchaware.SpritePainter.generateArtboard(16, 16);

    Manchaware.SpritePainter.colorPicker = ColorPicker($('#color-picker').get(0), function(hex, hsv, rgb) {
        Manchaware.SpritePainter.setCurrentColor(hex, hsv, rgb);
    });
});
