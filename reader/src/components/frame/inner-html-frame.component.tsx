import React, { useEffect, useState, Fragment } from 'react'

export type IFrameRenderHandler = (
    body: HTMLDivElement,
) => void

export const InnerHtmlFrameComponent = React.forwardRef<
    HTMLIFrameElement,
    {
        headText: string
        bodyText: string
        renderHandler: IFrameRenderHandler
        title: string
    } & React.HTMLProps<HTMLIFrameElement>
>(({ headText, bodyText, renderHandler, title, ...props }, ref) => {
    const [bodyRef, setBodyRef] = useState<HTMLDivElement | null>()
    useEffect(() => {
        if (bodyRef) {
            renderHandler(bodyRef)
        }
    }, [headText, bodyText, bodyRef])
    return (
        <div ref={setBodyRef} {...props} dangerouslySetInnerHTML={{__html: bodyText
        }}/>
/*
        <IframeComponent title={title} {...props} ref={ref}>
            <Fragment>
                <title ref={setHeadRef}>Ref</title>
                <style>{BodyStyle}</style>
            </Fragment>
            <div
                ref={setBodyRef}
                dangerouslySetInnerHTML={{ __html: bodyText }}
            />
        </IframeComponent>
*/
    )
})
