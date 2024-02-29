export function scaledPoints(x_points,y_points,width,height, padPx=2){
    //scale points
    let x_points_cpy = [...x_points]
    let y_points_cpy = [...y_points]

    let min_x = Math.min(...x_points.filter(e => {return e!==null}));
    let max_x = Math.max(...x_points.filter(e => {return e!==null})) - min_x;

    let min_y = Math.min(...y_points.filter(e => {return e!==null}));
    let max_y = Math.max(...y_points.filter(e => {return e!==null})) - min_y;
    
    let max_rect = Math.max(max_x,max_y)
    
    for(let i = 0; i < y_points.length;i++){
        x_points_cpy[i] = x_points[i] != null? Math.round(((x_points[i]-min_x)/max_rect) * (width-2*padPx)+padPx): null;
        y_points_cpy[i] = y_points[i] != null? Math.round(((y_points[i]-min_y)/max_rect) * (height-2*padPx)+padPx): null;
    }

    return {"x":x_points_cpy,"y":y_points_cpy};
}

export function imageDataToNormalizedImageMatrix(imdata){
    let matrix = [];
    let currRow = [];
    for(let i = 0; i <= imdata.height*imdata.width; i += 1){
        if(i%imdata.width == 0 && i > 0){
            matrix.push(currRow);
            currRow = [];
        }
        currRow.push([parseFloat(imdata.data[i*4+3])/255]);
    }
    return matrix;
}