export default function WistiaPlayer() {
    return (
        <>
            <script
                src="https://fast.wistia.com/player.js"
                async
            ></script>

            <script
                src="https://fast.wistia.com/embed/y871njxmef.js"
                async
                type="module"
            ></script>

            <style>{`
        wistia-player[media-id='y871njxmef']:not(:defined) {
          background: center / contain no-repeat
            url('https://fast.wistia.com/embed/medias/y871njxmef/swatch');
          display: block;
          filter: blur(5px);
          padding-top: 56.25%;
        }
      `}</style>
            <div className="w-1/2">

                <wistia-player
                    media-id="y871njxmef"
                    aspect="1.7777777777777777"
                ></wistia-player>
            </div>
        </>
    );
}