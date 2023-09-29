import axios from '@nextcloud/axios';
import { ncOcsSharingUrl, ncShareHeaders, getAllUserShares } from './index'; // Replace 'your-module' with the actual module path containing getAllUserShares.

// Mock Axios for testing
jest.mock('@nextcloud/axios');

describe('getAllUserShares', () => {
  it('should make a GET request with the correct URL and headers', async () => {
    // Create a mock for Axios.get
    const axiosGetMock = jest.spyOn(axios, 'get');

    // Mock the Axios request to resolve with a dummy response
    const dummyResponseData = { /* Your dummy data here */ };
    axiosGetMock.mockResolvedValue({ data: dummyResponseData });

    // Call the function
    await getAllUserShares();

    // Assert that Axios.get was called with the correct arguments
    expect(axiosGetMock).toHaveBeenCalledWith(
      ncOcsSharingUrl,
      {
        headers: ncShareHeaders,
      }
    );
  });

  // Add more meaningful test cases as needed
});
