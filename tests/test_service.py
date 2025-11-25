from src.service import generate_short_url

async def test_generate_short_url(session):
    res = await generate_short_url("https://google.com", session)
    assert type(res) is str
    assert len(res) == 6