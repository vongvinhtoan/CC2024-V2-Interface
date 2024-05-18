import React from 'react'
import 'bootstrap/dist/css/bootstrap.min.css';

function PreviewGrid({ preview }) {
    return (
        <div className='d-flex'>
            <div className='container'>
            {
                preview.map((row, i) => {
                    return (
                        <div key={i} className='row'>
                        {
                            row.map((cell, j) => {
                                return (
                                    <div key={j} className='col p-0'>
                                        <img key={j} src={cell} alt='' className='p-0 img-fluid' />
                                    </div>
                                )
                            })
                        }
                        </div>
                    )
                })
            }
            </div>
        </div>
    )
}

export default PreviewGrid