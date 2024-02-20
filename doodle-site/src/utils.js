

export function descriptionText(label,perc,map){
    if (perc == 0){
        return "Start drawing!";
    }
    else if(perc < 0.2){
        return "I'm not quite sure what I'm looking at...";
    }
    else if(perc <= 0.6){
        return `This might be ${map[label]}`;
    }
    else if(perc <= 0.8){
        return `I'm pretty sure it's ${map[label]}`;
    }
    else if(perc <= 1){
        return `I see ${map[label]}`;
    }
    return "";
}

export function getImageBounds(imageMatrix2D,pad){
    let top = imageMatrix2D.length;
    let bottom = 0;
    let right = 0;
    let left = imageMatrix2D[0].length;

    for(let i = 0; i <imageMatrix2D.length; i++){
        for (let j = 0; j <imageMatrix2D[0].length; j++){
            if(imageMatrix2D[i][j] > 0){
                top = Math.min(top,i);
                bottom = Math.max(bottom,i);
                left = Math.min(left,j);
                right = Math.max(right,j);
            }
        }
    }
    return {
        "top":Math.max(0,top-pad),
        "bottom":Math.min(imageMatrix2D.length,bottom+pad),
        "left":Math.max(0,left-pad),
        "right":Math.min(imageMatrix2D[0].length,right+pad)
        }
}

export function getMatrixFromImageData(imdata){
    let matrix = [];
    let currRow = [];
    for(let i = 0; i <= imdata.height*imdata.width; i += 1){
        if(i%imdata.width == 0 && i > 0){
            matrix.push(currRow);
            currRow = [];
        }
        currRow.push(parseFloat(imdata.data[i*4+3]));
    }
    return matrix;
}