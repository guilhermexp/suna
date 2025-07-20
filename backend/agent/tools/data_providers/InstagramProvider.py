from typing import Dict

from agent.tools.data_providers.RapidDataProviderBase import RapidDataProviderBase, EndpointSchema


class InstagramProvider(RapidDataProviderBase):
    def __init__(self):
        endpoints: Dict[str, EndpointSchema] = {
            "hls": {
                "route": "/api/instagram/hls",
                "method": "GET",
                "name": "Instagram HLS Stream",
                "description": "Get HLS stream data for Instagram content",
                "payload": {
                    # Adicione os parâmetros necessários aqui baseado na documentação da API
                    # Por enquanto, deixarei vazio já que a curl não mostra parâmetros
                }
            }
        }
        base_url = "https://instagram120.p.rapidapi.com"
        super().__init__(base_url, endpoints)


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    tool = InstagramProvider()

    # Example for getting Instagram HLS stream
    hls_data = tool.call_endpoint(
        route="hls",
        payload={}
    )
    print("HLS Data:", hls_data)