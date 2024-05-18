import React from 'react'

function HintGrid({ hint, preview }) {
    console.log(hint);
    console.log(preview);

    const backgroundColor = (cell) => {
        console.log(cell);
        if(cell === 0 || cell === 3) {
            return 'blue';
        } else if(cell == 2) {
            return 'red';
        } else {
            return 'white';
        } 
    }

    return (
        <div className='d-flex align-items-center'>
            <div className='container'>
            {
                hint.map((row, i) => (
                    <div key={i} className='row'>{
                        row.map((cell, j) => (
                            <div 
                                key={j} 
                                className='d-flex col justify-content-center align-items-center' 
                                style={{width:200, height:75, outlineColor:'black', outline:'solid', padding:-10, background: backgroundColor(
                                    preview[Math.floor((i*hint[0].length + j) / preview[0].length)][(i*hint[0].length + j) % preview[0].length]
                                )}}
                                dangerouslySetInnerHTML={{__html: cell}}
                            >
                            </div>
                        ))
                    }
                    </div>
                ))
            }
            </div>
        </div>
    )
}

export default HintGrid