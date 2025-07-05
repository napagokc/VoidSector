import asyncio
import multiprocessing as mp
import time

from contextlib import suppress
from multiprocessing import Manager, freeze_support
from threading import Thread

from modules.sectorServer import EngineSector_interactor
from modules.flaskApp import ServerInteractorFlaskApp
from modules.network.WebsocketController import ConnectionController


server = EngineSector_interactor()
loop = asyncio.get_event_loop()
loop_thread = Thread(target=loop.run_forever)
flask_app = ServerInteractorFlaskApp()


async def teardown():
    for task in asyncio.all_tasks():
        task.cancel()
        with suppress(asyncio.CancelledError):
            await task


def main():
    mp.set_start_method('spawn')
    freeze_support()

    try:
        server.init_server(Manager())

        loop.create_task(ConnectionController.main())
        loop.create_task(ConnectionController.broadcast())

        server.start()
        loop_thread.start()
        flask_app.run_forever()
    except KeyboardInterrupt:
        pass
    finally:
        flask_app.stop()

        loop.stop()
        while loop.is_running():
            time.sleep(0.04)

        loop.run_until_complete(teardown())
        while loop.is_running():
            time.sleep(0.04)

        server.stop()

if __name__ == '__main__':
    main()